import WebSocket from "ws";
import type { CdpCommandResponse, RuntimeEvaluateResult } from "./CdpTypes.js";
import { withTimeout } from "../utils/timeout.js";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class CdpConnection {
  private readonly ws: WebSocket;
  private readonly pending = new Map<number, PendingRequest>();
  private commandId = 0;

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.on("message", (raw) => this.onMessage(raw.toString("utf8")));
    this.ws.on("error", (error) => this.rejectAll(error));
    this.ws.on("close", () => this.rejectAll(new Error("CDP connection closed")));
  }

  static async connect(url: string): Promise<CdpConnection> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", (error) => reject(error));
    });
    return new CdpConnection(ws);
  }

  get isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }

  async close(): Promise<void> {
    if (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.ws.once("close", () => resolve());
      this.ws.close();
    });
  }

  async sendCommand<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
    timeoutMs = 10_000,
  ): Promise<T> {
    const id = ++this.commandId;
    const payload = JSON.stringify({
      id,
      method,
      params,
    });

    const responsePromise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.ws.send(payload, (error) => {
        if (!error) {
          return;
        }
        this.pending.delete(id);
        reject(error);
      });
    });

    return await withTimeout(responsePromise, timeoutMs, `CDP command timed out: ${method}`);
  }

  async evaluate<T>(expression: string, timeoutMs = 10_000): Promise<T> {
    const response = await this.sendCommand<RuntimeEvaluateResult>(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
      },
      timeoutMs,
    );
    if (response.exceptionDetails) {
      throw new Error(
        `Runtime.evaluate threw exception: ${JSON.stringify(response.exceptionDetails)}`,
      );
    }
    return response.result?.value as T;
  }

  async insertText(text: string): Promise<void> {
    await this.sendCommand("Input.insertText", { text });
  }

  async dispatchKeyEvent(
    type: "keyDown" | "keyUp" | "char",
    options: { key: string; code: string; windowsVirtualKeyCode: number },
  ): Promise<void> {
    await this.sendCommand("Input.dispatchKeyEvent", {
      type,
      ...options,
    });
  }

  async captureScreenshot(): Promise<string> {
    const response = await this.sendCommand<{ data?: string }>("Page.captureScreenshot", {
      format: "png",
    });
    if (!response.data) {
      throw new Error("Screenshot data was empty");
    }
    return response.data;
  }

  private onMessage(raw: string): void {
    let decoded: CdpCommandResponse | undefined;
    try {
      decoded = JSON.parse(raw) as CdpCommandResponse;
    } catch {
      return;
    }

    if (!decoded.id) {
      return;
    }
    const pending = this.pending.get(decoded.id);
    if (!pending) {
      return;
    }
    this.pending.delete(decoded.id);
    if (decoded.error) {
      pending.reject(new Error(decoded.error.message));
      return;
    }
    pending.resolve(decoded.result);
  }

  private rejectAll(error: unknown): void {
    for (const [, pending] of this.pending) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}
