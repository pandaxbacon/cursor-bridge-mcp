import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent, toolTargetSelectorSchema } from "./shared.js";

export function registerCursorActOnConfirmationTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_act_on_confirmation",
    {
      description: "Explicitly accept/reject one Cursor confirmation prompt with safety checks.",
      inputSchema: {
        target: toolTargetSelectorSchema,
        action: z.enum(["accept", "reject"]),
        confirmationId: z.string().min(1),
      },
    },
    async ({ target, action, confirmationId }) => {
      return jsonContent(
        await bridge.actOnConfirmation({
          target,
          action,
          confirmationId,
        }),
      );
    },
  );
}
