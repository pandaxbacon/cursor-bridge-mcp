import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorSendMessageTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_send_message",
    {
      description:
        "Insert text into Cursor chat and optionally submit; returns quickly with operation metadata.",
      inputSchema: {
        target: toolTargetSelectorSchema,
        text: z.string().min(1),
        chatId: z.string().min(1).optional(),
        submit: z.boolean().optional(),
      },
    },
    async ({ target, text, chatId, submit }) => {
      return jsonContent(await bridge.sendMessage({ target, text, chatId, submit }));
    },
  );
}
