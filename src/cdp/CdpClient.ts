import { BridgeError } from "../utils/errors.js";
import { CdpConnection } from "./CdpConnection.js";
import type { CdpTargetInfo, CdpVersionInfo } from "./CdpTypes.js";

export class CdpClient {
  constructor(private readonly port: number) {}

  get baseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  async listTargets(): Promise<CdpTargetInfo[]> {
    return await this.fetchJson<CdpTargetInfo[]>("/json");
  }

  async getVersionInfo(): Promise<CdpVersionInfo> {
    return await this.fetchJson<CdpVersionInfo>("/json/version");
  }

  async connectToTarget(targetId: string): Promise<CdpConnection> {
    const targets = await this.listTargets();
    const target = targets.find((item) => item.id === targetId);
    if (!target) {
      throw new BridgeError(`Target not found: ${targetId}`, "TARGET_NOT_FOUND");
    }
    if (!target.webSocketDebuggerUrl) {
      throw new BridgeError(
        `Target does not expose webSocketDebuggerUrl: ${targetId}`,
        "CDP_UNAVAILABLE",
      );
    }
    return await CdpConnection.connect(target.webSocketDebuggerUrl);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.listTargets();
      return true;
    } catch {
      return false;
    }
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new BridgeError(
        `CDP endpoint returned HTTP ${response.status} for ${path}`,
        "CDP_UNAVAILABLE",
      );
    }
    return (await response.json()) as T;
  }
}
