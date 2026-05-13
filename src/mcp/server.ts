import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../cursor/CursorBridge.js";
import { toErrorResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { registerCursorActOnConfirmationTool } from "./tools/cursorActOnConfirmation.js";
import { registerCursorDescribeWindowTool } from "./tools/cursorDescribeWindow.js";
import { registerCursorDetectConfirmationsTool } from "./tools/cursorDetectConfirmations.js";
import { registerCursorGetLatestTurnTool } from "./tools/cursorGetLatestTurn.js";
import { registerCursorHealthCheckTool } from "./tools/cursorHealthCheck.js";
import { registerCursorListChatsTool } from "./tools/cursorListChats.js";
import { registerCursorListWindowsTool } from "./tools/cursorListWindows.js";
import { registerCursorScreenshotTool } from "./tools/cursorScreenshot.js";
import { registerCursorSelectChatTool } from "./tools/cursorSelectChat.js";
import { registerCursorSendMessageTool } from "./tools/cursorSendMessage.js";
import { registerCursorWaitForResponseTool } from "./tools/cursorWaitForResponse.js";

export function createMcpServer(): McpServer {
  const bridge = new CursorBridge();
  const server = new McpServer(
    {
      name: "cursor-bridge-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  const registerSafe = (registerFn: (server: McpServer, bridge: CursorBridge) => void): void => {
    try {
      registerFn(server, bridge);
    } catch (error) {
      const info = toErrorResult(error);
      logger.error("Failed to register tool", info);
      throw error;
    }
  };

  registerSafe(registerCursorListWindowsTool);
  registerSafe(registerCursorDescribeWindowTool);
  registerSafe(registerCursorListChatsTool);
  registerSafe(registerCursorSelectChatTool);
  registerSafe(registerCursorSendMessageTool);
  registerSafe(registerCursorGetLatestTurnTool);
  registerSafe(registerCursorWaitForResponseTool);
  registerSafe(registerCursorScreenshotTool);
  registerSafe(registerCursorDetectConfirmationsTool);
  registerSafe(registerCursorActOnConfirmationTool);
  registerSafe(registerCursorHealthCheckTool);

  return server;
}
