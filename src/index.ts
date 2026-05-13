import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./mcp/server.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Cursor Bridge MCP server started (stdio transport)");
}

main().catch((error) => {
  logger.error("Fatal server error", { error: String(error) });
  process.exit(1);
});
