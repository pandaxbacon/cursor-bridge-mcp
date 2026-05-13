import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorDescribeWindowTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_describe_window",
    {
      description: "Describe one Cursor window including workspace, chat and selector health.",
      inputSchema: {
        target: toolTargetSelectorSchema,
      },
    },
    async ({ target }) => {
      const data = await bridge.describeWindow({ target });
      return jsonContent(data);
    },
  );
}
