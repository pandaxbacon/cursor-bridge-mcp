import crypto from "node:crypto";
import { CdpClient } from "../cdp/CdpClient.js";
import { toCursorWindow, isLikelyCursorTarget } from "../cdp/CursorDiscovery.js";
import type {
  CursorChatSummary,
  CursorConfirmation,
  CursorSelectorHealth,
  CursorTurn,
  CursorWindowInfo,
} from "../cdp/CdpTypes.js";
import { loadConfig, resolveCdpPort } from "../config/loadConfig.js";
import type { BridgeConfig, TargetSelectorInput } from "../config/schema.js";
import { ConfirmationPolicy } from "../safety/ConfirmationPolicy.js";
import { OperationLock } from "../safety/OperationLock.js";
import { BridgeError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { pollUntilStable } from "../utils/timeout.js";
import { CursorDomInspector } from "./CursorDomInspector.js";
import { resolveTarget } from "./CursorTargetResolver.js";

export interface SendMessageInput {
  target: TargetSelectorInput;
  text: string;
  chatId?: string;
  submit?: boolean;
  port?: number;
}

export interface WaitForResponseInput {
  target: TargetSelectorInput;
  chatId?: string;
  timeoutMs: number;
  quietPeriodMs: number;
  port?: number;
}

export class CursorBridge {
  private readonly operationLock = new OperationLock();
  private readonly config: BridgeConfig;
  private readonly confirmationPolicy: ConfirmationPolicy;

  constructor() {
    const loaded = loadConfig();
    this.config = loaded.config;
    this.confirmationPolicy = new ConfirmationPolicy(this.config);
    if (loaded.configPath) {
      logger.info("Loaded cursor bridge config", { configPath: loaded.configPath });
    }
  }

  getConfig(): BridgeConfig {
    return this.config;
  }

  async listWindows(portOverride?: number): Promise<CursorWindowInfo[]> {
    const port = resolveCdpPort(this.config, portOverride);
    const client = new CdpClient(port);
    const targets = await client.listTargets();
    const windows = targets.filter(isLikelyCursorTarget).map(toCursorWindow);

    await Promise.all(
      windows.map(async (window) => {
        if (!window.hasWebSocketDebuggerUrl) {
          return;
        }
        try {
          const connection = await client.connectToTarget(window.targetId);
          const inspector = new CursorDomInspector(connection);
          const chats = await inspector.listChats();
          const active = chats.find((item) => item.active);
          window.activeChatId = active?.chatId ?? null;
          await connection.close();
        } catch (error) {
          logger.debug("Window chat scan failed", {
            targetId: window.targetId,
            error: String(error),
          });
        }
      }),
    );

    return windows;
  }

  async describeWindow(input: { target: TargetSelectorInput; port?: number }): Promise<{
    window: CursorWindowInfo;
    chats: CursorChatSummary[];
    selectorHealth: CursorSelectorHealth;
    chatInputAvailable: boolean;
  }> {
    return await this.withTarget(input.target, input.port, async (window, inspector) => {
      const [chats, selectorHealth] = await Promise.all([
        inspector.listChats(),
        inspector.getSelectorHealth(),
      ]);
      return {
        window,
        chats,
        selectorHealth,
        chatInputAvailable: selectorHealth.chatInputAvailable,
      };
    });
  }

  async listChats(input: { target: TargetSelectorInput; port?: number }): Promise<{
    chats: CursorChatSummary[];
    activeChat: CursorChatSummary | null;
  }> {
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      const chats = await inspector.listChats();
      return {
        chats,
        activeChat: chats.find((item) => item.active) ?? null,
      };
    });
  }

  async selectChat(input: {
    target: TargetSelectorInput;
    chatId?: string;
    title?: string;
    port?: number;
  }): Promise<{
    ok: boolean;
    activeChat: CursorChatSummary | null;
    reason?: string;
  }> {
    if (!input.chatId && !input.title) {
      throw new BridgeError("chatId or title is required", "INVALID_INPUT");
    }
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      const result = await inspector.selectChat({ chatId: input.chatId, title: input.title });
      const chats = await inspector.listChats();
      return {
        ok: result.ok,
        activeChat: chats.find((chat) => chat.active) ?? null,
        reason: result.reason,
      };
    });
  }

  async sendMessage(input: SendMessageInput): Promise<{
    status: "queued" | "sent";
    operationId: string;
    targetId: string;
    chatId: string | null;
    submitted: boolean;
  }> {
    if (!input.text.trim()) {
      throw new BridgeError("text cannot be empty", "INVALID_INPUT");
    }

    return await this.withTarget(input.target, input.port, async (window, inspector) => {
      this.assertNoSelfControl(window);
      const lockKey = `${window.targetId}:${input.chatId ?? "active"}`;
      const unlock = await this.operationLock.acquire(lockKey);
      const operationId = crypto.randomUUID();
      try {
        if (input.chatId) {
          await inspector.selectChat({ chatId: input.chatId });
        }
        const focused = await inspector.focusChatInput();
        if (!focused.ok) {
          throw new BridgeError(`Unable to focus chat input: ${focused.reason}`, "DOM_ERROR");
        }

        await inspector.insertText(input.text);
        const submit = input.submit ?? true;
        if (submit) {
          const sent = await inspector.submit();
          if (!sent.ok) {
            // Fallback keypress for Cursor versions where button selector changed.
            await inspector.pressEnter();
          }
        }

        const chats = await inspector.listChats();
        const active = chats.find((chat) => chat.active);
        return {
          status: submit ? "sent" : "queued",
          operationId,
          targetId: window.targetId,
          chatId: active?.chatId ?? null,
          submitted: submit,
        };
      } finally {
        unlock();
      }
    });
  }

  async getLatestTurn(input: {
    target: TargetSelectorInput;
    chatId?: string;
    port?: number;
  }): Promise<CursorTurn> {
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      return await inspector.getLatestTurn(input.chatId);
    });
  }

  async waitForResponse(input: WaitForResponseInput): Promise<{
    turn: CursorTurn;
    timedOut: boolean;
  }> {
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      const result = await pollUntilStable(
        () => inspector.getLatestTurn(input.chatId),
        (previous, current) =>
          previous.assistantText === current.assistantText &&
          previous.thinkingText === current.thinkingText &&
          previous.isStreaming === current.isStreaming &&
          !current.isStreaming,
        {
          timeoutMs: input.timeoutMs,
          intervalMs: 1_000,
          quietPeriodMs: input.quietPeriodMs,
        },
      );

      return {
        turn: result.result,
        timedOut: result.timedOut,
      };
    });
  }

  async screenshot(input: { target: TargetSelectorInput; port?: number }): Promise<{
    mimeType: "image/png";
    base64: string;
  }> {
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      return {
        mimeType: "image/png",
        base64: await inspector.captureScreenshot(),
      };
    });
  }

  async detectConfirmations(input: {
    target: TargetSelectorInput;
    port?: number;
  }): Promise<CursorConfirmation[]> {
    return await this.withTarget(input.target, input.port, async (_window, inspector) => {
      return await inspector.detectConfirmations();
    });
  }

  async actOnConfirmation(input: {
    target: TargetSelectorInput;
    confirmationId: string;
    action: "accept" | "reject";
    port?: number;
  }): Promise<{
    ok: boolean;
    reason?: string;
    confirmationId: string;
  }> {
    return await this.withTarget(input.target, input.port, async (window, inspector) => {
      this.assertNoSelfControl(window);
      const confirmations = await inspector.detectConfirmations();
      const confirmation = confirmations.find(
        (item) => item.confirmationId === input.confirmationId,
      );
      if (!confirmation) {
        throw new BridgeError("confirmationId not found", "TARGET_NOT_FOUND");
      }

      const decision = this.confirmationPolicy.canApplyAction(confirmation, input.action);
      if (!decision.allowed) {
        throw new BridgeError(decision.reason, "SAFETY_BLOCKED", {
          confirmationId: input.confirmationId,
          riskLevel: confirmation.riskLevel,
        });
      }

      const result = await inspector.actOnConfirmation(input.confirmationId, input.action);
      return {
        ok: result.ok,
        reason: result.reason,
        confirmationId: input.confirmationId,
      };
    });
  }

  async healthCheck(portOverride?: number): Promise<{
    port: number;
    cdpReachable: boolean;
    targetCount: number;
    cursorTargetCount: number;
    selectorHealth: CursorSelectorHealth | null;
    diagnostics: string[];
  }> {
    const diagnostics: string[] = [];
    const port = resolveCdpPort(this.config, portOverride);
    const client = new CdpClient(port);
    const reachable = await client.isAvailable();
    if (!reachable) {
      return {
        port,
        cdpReachable: false,
        targetCount: 0,
        cursorTargetCount: 0,
        selectorHealth: null,
        diagnostics: [
          "CDP endpoint unavailable. Launch Cursor with --remote-debugging-port and --remote-allow-origins.",
        ],
      };
    }

    const targets = await client.listTargets();
    const cursorTargets = targets.filter(isLikelyCursorTarget);
    if (cursorTargets.length === 0) {
      diagnostics.push("No Cursor-like page targets found on /json endpoint.");
    }

    let selectorHealth: CursorSelectorHealth | null = null;
    if (cursorTargets[0]?.webSocketDebuggerUrl) {
      try {
        const connection = await client.connectToTarget(cursorTargets[0].id);
        const inspector = new CursorDomInspector(connection);
        selectorHealth = await inspector.getSelectorHealth();
        if (!selectorHealth.chatInputAvailable) {
          diagnostics.push("Chat input selector not found. Cursor UI may have changed.");
        }
        await connection.close();
      } catch (error) {
        diagnostics.push(`Selector inspection failed: ${String(error)}`);
      }
    }

    if (diagnostics.length === 0) {
      diagnostics.push("Healthy");
    }

    return {
      port,
      cdpReachable: true,
      targetCount: targets.length,
      cursorTargetCount: cursorTargets.length,
      selectorHealth,
      diagnostics,
    };
  }

  private assertNoSelfControl(window: CursorWindowInfo): void {
    if (this.config.safety.allowSelfControl) {
      return;
    }
    const cwd = process.cwd().toLowerCase();
    const workspacePath = window.workspacePath?.toLowerCase();
    if (workspacePath && (workspacePath === cwd || cwd.startsWith(workspacePath))) {
      throw new BridgeError(
        "Safety check blocked potential self-control loop. Target appears to match the MCP server workspace.",
        "SAFETY_BLOCKED",
      );
    }
  }

  private async withTarget<T>(
    selector: TargetSelectorInput,
    portOverride: number | undefined,
    action: (window: CursorWindowInfo, inspector: CursorDomInspector) => Promise<T>,
  ): Promise<T> {
    const windows = await this.listWindows(portOverride ?? selector.port);
    const resolved = resolveTarget(selector, windows, this.config);
    const port = resolveCdpPort(this.config, portOverride ?? selector.port);
    const client = new CdpClient(port);
    const connection = await client.connectToTarget(resolved.target.targetId);
    const inspector = new CursorDomInspector(connection);
    try {
      return await action(resolved.target, inspector);
    } finally {
      await connection.close();
    }
  }
}
