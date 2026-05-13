import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorListChatsTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_list_chats",
    {
      description: "List chats/composers in a selected Cursor window.",
      inputSchema: {
        target: toolTargetSelectorSchema,
      },
    },
    async ({ target }) => {
      return jsonContent(await bridge.listChats({ target }));
    },
  );
}
