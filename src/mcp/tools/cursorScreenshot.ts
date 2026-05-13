import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorScreenshotTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_screenshot",
    {
      description: "Capture a screenshot of the selected Cursor window via CDP.",
      inputSchema: {
        target: toolTargetSelectorSchema,
      },
    },
    async ({ target }) => {
      return jsonContent(await bridge.screenshot({ target }));
    },
  );
}
