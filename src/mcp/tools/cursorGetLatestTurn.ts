import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorGetLatestTurnTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_get_latest_turn",
    {
      description: "Extract latest user+assistant turn details from Cursor chat DOM.",
      inputSchema: {
        target: toolTargetSelectorSchema,
        chatId: z.string().min(1).optional(),
      },
    },
    async ({ target, chatId }) => {
      const turn = await bridge.getLatestTurn({ target, chatId });
      return jsonContent(turn);
    },
  );
}
