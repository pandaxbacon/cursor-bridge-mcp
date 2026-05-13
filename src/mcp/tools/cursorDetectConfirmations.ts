import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorDetectConfirmationsTool(
  server: McpServer,
  bridge: CursorBridge,
): void {
  server.registerTool(
    "cursor_detect_confirmations",
    {
      description:
        "Detect visible tool/file confirmations in Cursor and return risk-scored metadata.",
      inputSchema: {
        target: toolTargetSelectorSchema,
      },
    },
    async ({ target }) => {
      return jsonContent({
        confirmations: await bridge.detectConfirmations({ target }),
      });
    },
  );
}
