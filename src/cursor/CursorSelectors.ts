/**
 * Cursor's internal DOM is not part of a public API and can change across releases.
 * Keep all selectors centralized here so breakages are easier to diagnose/fix.
 */
export const CursorSelectors = {
  chatInput: [".aislash-editor-input", '[data-lexical-editor="true"][contenteditable="true"]'],
  sendButton: [
    ".send-with-mode .anysphere-icon-button",
    'button[aria-label="Send"]',
    ".send-with-mode button",
  ],
  chatTabs: [
    '[class*="agent-tabs"] li[class*="action-item"] a[aria-id="chat-horizontal-tab"]',
    ".tab .composer-tab-label",
  ],
  activeChatTab: [
    '[class*="agent-tabs"] li[class*="checked"] a[aria-id="chat-horizontal-tab"]',
    ".tab.selected .composer-tab-label",
    ".tab.active .composer-tab-label",
  ],
  composerContainer: ["[data-composer-id]", ".composer-bar", ".composite.auxiliarybar"],
  humanAiPair: [".composer-human-ai-pair-container"],
  markdownSection: [".anysphere-markdown-container-root .markdown-section"],
  codeBlocks: [".markdown-block-code"],
  confirmationButtons: ['[data-click-ready="true"]'],
  confirmationContainer: [".composer-tool-former-message"],
  toolMessage: ['[data-message-kind="tool"]'],
} as const;
