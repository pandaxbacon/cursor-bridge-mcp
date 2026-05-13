import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent } from "./shared.js";

export function registerCursorListWindowsTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_list_windows",
    {
      description: "List available Cursor CDP windows/targets.",
      inputSchema: {
        port: z.number().int().min(1).max(65535).optional(),
      },
    },
    async ({ port }) => {
      const windows = await bridge.listWindows(port);
      return jsonContent({
        windows,
        count: windows.length,
      });
    },
  );
}
