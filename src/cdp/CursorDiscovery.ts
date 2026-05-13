import type { CdpTargetInfo, CursorWindowInfo } from "./CdpTypes.js";

function parseWorkspaceLabelFromTitle(title: string): string | null {
  const parts = title.split(" - ");
  if (parts.length >= 3 && parts[parts.length - 1] === "Cursor") {
    return parts[parts.length - 2] ?? null;
  }
  return null;
}

function parseWorkspacePathFromUrl(url: string): string | null {
  if (!url.startsWith("vscode-file://")) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const decoded = decodeURIComponent(parsed.pathname);
    if (!decoded) {
      return null;
    }
    // `vscode-file://vscode-app/<path>` keeps the absolute path in pathname.
    if (decoded.match(/^\/[A-Za-z]:\//)) {
      return decoded.slice(1);
    }
    return decoded;
  } catch {
    return null;
  }
}

export function isLikelyCursorTarget(target: CdpTargetInfo): boolean {
  if (target.type !== "page") {
    return false;
  }
  const title = target.title ?? "";
  const url = target.url ?? "";
  if (url.startsWith("devtools://")) {
    return false;
  }
  return title.includes("Cursor") || url.startsWith("vscode-file://");
}

export function toCursorWindow(target: CdpTargetInfo): CursorWindowInfo {
  const title = target.title ?? "";
  const url = target.url ?? "";
  return {
    targetId: target.id,
    title,
    url,
    hasWebSocketDebuggerUrl: Boolean(target.webSocketDebuggerUrl),
    workspaceLabel: parseWorkspaceLabelFromTitle(title),
    workspacePath: parseWorkspacePathFromUrl(url),
    activeChatId: null,
    connectionStatus: target.webSocketDebuggerUrl ? "connected" : "disconnected",
  };
}
