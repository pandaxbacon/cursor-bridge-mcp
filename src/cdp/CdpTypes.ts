export interface CdpTargetInfo {
  id: string;
  type: string;
  title?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
}

export interface CdpVersionInfo {
  Browser?: string;
  "Protocol-Version"?: string;
  "User-Agent"?: string;
  webSocketDebuggerUrl?: string;
}

export interface CdpCommandResponse<T = unknown> {
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface RuntimeEvaluateResult {
  result?: {
    type?: string;
    value?: unknown;
    description?: string;
  };
  exceptionDetails?: unknown;
}

export interface CursorWindowInfo {
  targetId: string;
  title: string;
  url: string;
  hasWebSocketDebuggerUrl: boolean;
  workspaceLabel: string | null;
  workspacePath: string | null;
  activeChatId: string | null;
  connectionStatus: "connected" | "disconnected";
}

export interface CursorChatSummary {
  chatId: string;
  title: string;
  active: boolean;
  composerId: string | null;
  lastMessageId: string | null;
}

export interface CursorCodeBlock {
  language: string | null;
  content: string;
}

export interface CursorTurn {
  userText: string | null;
  assistantText: string | null;
  thinkingText: string | null;
  toolUseSummary: string[];
  codeBlocks: CursorCodeBlock[];
  filesMentioned: string[];
  isStreaming: boolean;
  timestamp: string;
}

export interface CursorConfirmation {
  confirmationId: string;
  type: "tool" | "file_edit" | "unknown";
  text: string;
  buttons: Array<{
    id: string;
    label: string;
    action: "accept" | "reject" | "unknown";
  }>;
  riskLevel: "low" | "medium" | "high";
}

export interface CursorSelectorHealth {
  chatInputAvailable: boolean;
  chatTabCount: number;
  composerContainerCount: number;
  pairContainerCount: number;
  confirmationBlockCount: number;
  notes: string[];
}
