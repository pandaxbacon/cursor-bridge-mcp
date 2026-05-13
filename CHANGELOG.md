# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to Semantic Versioning.

## [Unreleased]

### Changed

- Refreshed `README.md` with visual badges, GitHub-compatible Mermaid diagrams, and a more concise quick-start oriented layout.
- Clarified in `README.md` that Hermes and OpenClaw-style MCP agents can connect to local Cursor and perform development workflows through this bridge.

## [0.1.0] - 2026-05-13

### Added

- Initial TypeScript MCP server implementation for Cursor CDP bridging.
- CDP client and connection layers for target discovery, evaluation, text input, key events, and screenshots.
- Cursor bridge modules for window/chats detection, message send/read workflows, response waiting, and confirmation handling.
- Safety controls: selector-based targeting, per-target operation lock, explicit confirmation policy, and self-control loop guard.
- MCP tools: `cursor_list_windows`, `cursor_describe_window`, `cursor_list_chats`, `cursor_select_chat`, `cursor_send_message`, `cursor_get_latest_turn`, `cursor_wait_for_response`, `cursor_screenshot`, `cursor_detect_confirmations`, `cursor_act_on_confirmation`, and `cursor_health_check`.
- Configuration support via `cursor-bridge.config.json` with workspace aliases and safety policy.
- Unit and integration test suites with `RUN_CURSOR_INTEGRATION=1` opt-in gating.
- Documentation and examples (`README.md`, `SECURITY.md`, example config files).
