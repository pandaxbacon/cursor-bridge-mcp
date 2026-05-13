import type {
  CursorChatSummary,
  CursorConfirmation,
  CursorSelectorHealth,
  CursorTurn,
} from "../cdp/CdpTypes.js";
import { CdpConnection } from "../cdp/CdpConnection.js";
import {
  actOnConfirmationSnippet,
  clickSendSnippet,
  detectConfirmationsSnippet,
  focusInputSnippet,
  latestTurnSnippet,
  listChatsSnippet,
  selectChatSnippet,
  selectorHealthSnippet,
} from "./CursorSnippets.js";
import { BridgeError } from "../utils/errors.js";

export class CursorDomInspector {
  constructor(private readonly connection: CdpConnection) {}

  async getSelectorHealth(): Promise<CursorSelectorHealth> {
    return await this.connection.evaluate<CursorSelectorHealth>(selectorHealthSnippet());
  }

  async listChats(): Promise<CursorChatSummary[]> {
    return await this.connection.evaluate<CursorChatSummary[]>(listChatsSnippet());
  }

  async selectChat(params: { chatId?: string; title?: string }): Promise<{
    ok: boolean;
    reason?: string;
    active?: CursorChatSummary;
  }> {
    return await this.connection.evaluate(selectChatSnippet(params.chatId, params.title));
  }

  async focusChatInput(): Promise<{ ok: boolean; selectorUsed?: string; reason?: string }> {
    return await this.connection.evaluate(focusInputSnippet());
  }

  async insertText(text: string): Promise<void> {
    await this.connection.insertText(text);
  }

  async submit(): Promise<{ ok: boolean; selectorUsed?: string; reason?: string }> {
    return await this.connection.evaluate(clickSendSnippet());
  }

  async getLatestTurn(chatId?: string): Promise<CursorTurn> {
    return await this.connection.evaluate<CursorTurn>(latestTurnSnippet(chatId));
  }

  async detectConfirmations(): Promise<CursorConfirmation[]> {
    return await this.connection.evaluate<CursorConfirmation[]>(detectConfirmationsSnippet());
  }

  async actOnConfirmation(
    confirmationId: string,
    action: "accept" | "reject",
  ): Promise<{ ok: boolean; reason?: string; label?: string }> {
    return await this.connection.evaluate(actOnConfirmationSnippet(confirmationId, action));
  }

  async captureScreenshot(): Promise<string> {
    return await this.connection.captureScreenshot();
  }

  async pressEnter(): Promise<void> {
    try {
      await this.connection.dispatchKeyEvent("keyDown", {
        key: "Enter",
        code: "Enter",
        windowsVirtualKeyCode: 13,
      });
      await this.connection.dispatchKeyEvent("keyUp", {
        key: "Enter",
        code: "Enter",
        windowsVirtualKeyCode: 13,
      });
    } catch (error) {
      throw new BridgeError("Failed to dispatch Enter key", "DOM_ERROR", error);
    }
  }
}
