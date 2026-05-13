# Security Policy

## Scope and deployment model

`cursor-bridge-mcp` is intended for local, trusted automation only.

- Prefer loopback-only use (`localhost`).
- Do not expose Cursor CDP ports on public or untrusted networks.
- Do not run this MCP server for untrusted clients.

## Why this matters

CDP has high privilege over the target app UI/DOM. If exposed, a malicious client could read editor content, trigger UI actions, or attempt unsafe confirmation clicks.

## Operational guidance

- Launch Cursor with the minimum needed CDP exposure.
- Keep `CURSOR_CDP_PORT` local-only.
- Use target selectors explicitly; avoid broad selectors where possible.
- Keep confirmation policy conservative (default blocks medium/high-risk accept actions).
- Require explicit user/client intent before `cursor_act_on_confirmation`.

## Prompt injection considerations

Hermes may receive content from files/chat messages that can contain malicious instructions. Treat model output as untrusted input and keep these controls enabled:

- send/read separation (`cursor_send_message` and `cursor_wait_for_response` are distinct)
- explicit confirmation actions only
- timeout-bounded waits
- operation locks for per-target write serialization

## Vulnerability reporting

If you discover a security issue, please open a private security advisory on GitHub (preferred) or create an issue with minimal reproduction details and mark it as security-sensitive.

Include:

- affected version/commit
- local environment
- reproduction steps
- impact assessment
