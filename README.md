# Cursor Bridge MCP

A TypeScript MCP server that lets Hermes control local Cursor IDE windows through CDP.

## Status

Experimental. Built for local automation and relies on Cursor internal DOM selectors that may break across Cursor releases.

## Architecture

Hermes -> MCP client -> `cursor-bridge-mcp` -> CDP WebSocket -> local Cursor windows/workspaces/chats

This server is designed for **external control** of Cursor windows (Hermes controls Cursor). It is not intended for self-referential control by the same Cursor instance.

## Features

- List Cursor windows/targets from CDP
- Target a specific workspace/window by `targetId`, alias, workspace path, or title fallback
- Send a message to Cursor chat (insert + optional submit)
- Read latest AI turn (assistant/user/thinking/tool summary/code blocks/files)
- Wait for response stabilization with timeout/quiet period
- List and select chats where detectable
- Detect confirmation prompts and risk-score them
- Explicit accept/reject actions for confirmations
- Screenshot support via CDP
- Workspace aliases via `cursor-bridge.config.json`
- Health checks (CDP reachability, target discovery, selector diagnostics)

## Non-goals

- Telegram bot integration
- Voice, transcription, TTS
- Cloud-hosted bridge service
- Bypassing Cursor security or safeguards
- Silently accepting destructive actions

## Requirements

- Node.js 20+ (tested with modern Node LTS)
- Cursor installed locally
- Cursor launched with a remote debugging port
- GitHub CLI (`gh`) only for repository setup workflows
- MCP-compatible client (Hermes)

## Installation

```bash
npm install
npm run build
```

## Run Cursor with CDP

```bash
cursor --remote-debugging-port=9222 --remote-allow-origins=http://localhost:9222
```

Default port is `9222`, overridable via:

- `CURSOR_CDP_PORT`
- tool-level `target.port`
- `cursor-bridge.config.json` (`defaultPort`)

## Running the MCP server

```bash
npm run dev
# or
npm run build && npm start
```

Uses MCP stdio transport first. The codebase is organized so streamable HTTP/SSE transport can be added later.

## MCP configuration example

See `examples/mcp.cursor.example.json`:

```json
{
  "mcpServers": {
    "cursor-bridge": {
      "command": "node",
      "args": ["/absolute/path/to/cursor-bridge-mcp/dist/index.js"],
      "env": {
        "CURSOR_CDP_PORT": "9222"
      }
    }
  }
}
```

## Example Hermes tool usage

```json
{
  "name": "cursor_list_windows",
  "arguments": {}
}
```

```json
{
  "name": "cursor_send_message",
  "arguments": {
    "target": { "workspaceAlias": "loyalty-api" },
    "text": "Please run tests and summarize failures.",
    "submit": true
  }
}
```

```json
{
  "name": "cursor_wait_for_response",
  "arguments": {
    "target": { "workspaceAlias": "loyalty-api" },
    "timeoutMs": 120000,
    "quietPeriodMs": 4000
  }
}
```

## Config file

Create `cursor-bridge.config.json` in project root (local-only, ignored by git):

```json
{
  "defaultPort": 9222,
  "aliases": {
    "loyalty-api": { "workspacePath": "/Users/me/work/loyalty-api" },
    "aem-game": { "workspacePath": "/Users/me/work/aem-game" }
  },
  "safety": {
    "allowSelfControl": false,
    "confirmationActions": {
      "allowAcceptForLowRisk": true,
      "allowAcceptForMediumRisk": false,
      "allowAcceptForHighRisk": false
    }
  }
}
```

## MCP tools

- `cursor_list_windows`
- `cursor_describe_window`
- `cursor_list_chats`
- `cursor_select_chat`
- `cursor_send_message`
- `cursor_get_latest_turn`
- `cursor_wait_for_response`
- `cursor_screenshot`
- `cursor_detect_confirmations`
- `cursor_act_on_confirmation`
- `cursor_health_check`

## Safety model

- Hermes is the controller, Cursor is the controlled target.
- Avoid using this MCP server in the same Cursor instance it controls.
- Send and read are separate operations (`cursor_send_message` vs `cursor_wait_for_response`).
- Response waits are timeout-bounded.
- Per-target operation locks prevent overlapping send operations in the same target/chat.
- Confirmation actions are explicit and policy-gated; destructive accepts are blocked by default.

## Troubleshooting

- **CDP port not open**: launch Cursor with remote debugging flags.
- **No targets found**: verify Cursor is running and check `http://localhost:9222/json`.
- **Selectors broke after Cursor update**: run `cursor_health_check`, then update `src/cursor/CursorSelectors.ts`.
- **Message inserted but not submitted**: set `submit: true`; if UI changed, verify send button selectors.
- **Multiple windows detected**: target by `targetId` or workspace alias to avoid ambiguity.
- **`remote-allow-origins` issue**: include `--remote-allow-origins=http://localhost:9222` in Cursor launch.

## Testing

```bash
npm run test:unit
```

Integration tests are opt-in and non-destructive by default:

```bash
RUN_CURSOR_INTEGRATION=1 npm run test:integration
```

## Development scripts

- `npm run build`
- `npm run dev`
- `npm start`
- `npm test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run lint`
- `npm run typecheck`
- `npm run format`

## Credits

Cursor CDP bridging ideas were inspired by [pocket-cursor](https://github.com/pandaxbacon/pocket-cursor).

## License

MIT
