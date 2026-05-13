import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorWaitForResponseTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_wait_for_response",
    {
      description: "Poll Cursor until a response stabilizes or timeout is reached.",
      inputSchema: {
        target: toolTargetSelectorSchema,
        chatId: z.string().min(1).optional(),
        timeoutMs: z.number().int().positive().max(300_000).default(60_000),
        quietPeriodMs: z.number().int().positive().max(120_000).default(3_000),
      },
    },
    async ({ target, chatId, timeoutMs, quietPeriodMs }) => {
      const result = await bridge.waitForResponse({
        target,
        chatId,
        timeoutMs,
        quietPeriodMs,
      });
      return jsonContent(result);
    },
  );
}
