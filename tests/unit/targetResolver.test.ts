import { describe, expect, it } from "vitest";
import { resolveTarget } from "../../src/cursor/CursorTargetResolver.js";
import type { CursorWindowInfo } from "../../src/cdp/CdpTypes.js";
import type { BridgeConfig } from "../../src/config/schema.js";

const windows: CursorWindowInfo[] = [
  {
    targetId: "a",
    title: "main.ts - loyalty-api - Cursor",
    url: "vscode-file://vscode-app/Users/me/work/loyalty-api/main.ts",
    hasWebSocketDebuggerUrl: true,
    workspaceLabel: "loyalty-api",
    workspacePath: "/Users/me/work/loyalty-api/main.ts",
    activeChatId: null,
    connectionStatus: "connected",
  },
  {
    targetId: "b",
    title: "README.md - aem-game - Cursor",
    url: "vscode-file://vscode-app/Users/me/work/aem-game/README.md",
    hasWebSocketDebuggerUrl: true,
    workspaceLabel: "aem-game",
    workspacePath: "/Users/me/work/aem-game/README.md",
    activeChatId: null,
    connectionStatus: "connected",
  },
];

const config: BridgeConfig = {
  defaultPort: 9222,
  aliases: {
    "loyalty-api": { workspacePath: "/Users/me/work/loyalty-api" },
  },
  safety: {
    allowSelfControl: false,
    confirmationActions: {
      allowAcceptForLowRisk: true,
      allowAcceptForMediumRisk: false,
      allowAcceptForHighRisk: false,
    },
  },
};

describe("resolveTarget", () => {
  it("resolves by targetId", () => {
    const result = resolveTarget({ targetId: "a" }, windows, config);
    expect(result.target.targetId).toBe("a");
  });

  it("resolves by workspaceAlias", () => {
    const result = resolveTarget({ workspaceAlias: "loyalty-api" }, windows, config);
    expect(result.target.targetId).toBe("a");
  });
});
