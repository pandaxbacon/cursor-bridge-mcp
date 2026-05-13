import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorSelectChatTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_select_chat",
    {
      description: "Focus/select a chat in a chosen Cursor window by chatId or title.",
      inputSchema: {
        target: toolTargetSelectorSchema,
        chatId: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
      },
    },
    async ({ target, chatId, title }) => {
      return jsonContent(await bridge.selectChat({ target, chatId, title }));
    },
  );
}
