import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CursorBridge } from "../../cursor/CursorBridge.js";
import { jsonContent } from "./shared.js";

export function registerCursorHealthCheckTool(server: McpServer, bridge: CursorBridge): void {
  server.registerTool(
    "cursor_health_check",
    {
      description: "Run diagnostics for CDP reachability, target discovery and selector readiness.",
      inputSchema: {
        port: z.number().int().min(1).max(65535).optional(),
      },
    },
    async ({ port }) => {
      return jsonContent(await bridge.healthCheck(port));
    },
  );
}
