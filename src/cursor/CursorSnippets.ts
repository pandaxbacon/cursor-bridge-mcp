import { CursorSelectors } from "./CursorSelectors.js";

function toJs(value: unknown): string {
  return JSON.stringify(value);
}

function selectorsConst(): string {
  return `const SELECTORS = ${toJs(CursorSelectors)};`;
}

export function selectorHealthSnippet(): string {
  return `
    (() => {
      ${selectorsConst()}
      const firstMatch = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return { selector, element };
        }
        return null;
      };
      const countFor = (selectors) => {
        for (const selector of selectors) {
          const count = document.querySelectorAll(selector).length;
          if (count > 0) return count;
        }
        return 0;
      };

      const input = firstMatch(SELECTORS.chatInput);
      return {
        chatInputAvailable: Boolean(input),
        chatTabCount: countFor(SELECTORS.chatTabs),
        composerContainerCount: countFor(SELECTORS.composerContainer),
        pairContainerCount: countFor(SELECTORS.humanAiPair),
        confirmationBlockCount: countFor(SELECTORS.confirmationContainer),
        notes: input ? ['chat input selector healthy: ' + input.selector] : ['chat input not found'],
      };
    })();
  `;
}

export function listChatsSnippet(): string {
  return `
    (() => {
      const chats = [];
      const agentTabs = document.querySelectorAll('[class*="agent-tabs"] li[class*="action-item"] a[aria-id="chat-horizontal-tab"]');
      agentTabs.forEach((a, index) => {
        const parent = a.closest('li');
        chats.push({
          chatId: (parent?.getAttribute('data-pc-id') ?? '') || ('idx-' + index),
          title: (a.getAttribute('aria-label') ?? a.textContent ?? '').trim(),
          active: parent?.classList.contains('checked') ?? false,
          composerId: null,
          lastMessageId: null
        });
      });

      if (chats.length === 0) {
        const tabs = document.querySelectorAll('.tab .composer-tab-label');
        tabs.forEach((label, index) => {
          const tab = label.closest('.tab');
          chats.push({
            chatId: (tab?.getAttribute('data-resource-name') ?? '') || ('tab-' + index),
            title: (label.textContent ?? '').trim(),
            active: tab?.classList.contains('active') || tab?.classList.contains('selected') || false,
            composerId: null,
            lastMessageId: null
          });
        });
      }

      return chats;
    })();
  `;
}

export function selectChatSnippet(chatId?: string, title?: string): string {
  return `
    (() => {
      const requestedChatId = ${toJs(chatId ?? null)};
      const requestedTitle = ${toJs(title ?? null)};

      const candidates = [];
      const tabs = document.querySelectorAll('[class*="agent-tabs"] li[class*="action-item"]');
      tabs.forEach((li) => {
        const a = li.querySelector('a[aria-id="chat-horizontal-tab"]');
        if (!a) return;
        candidates.push({
          chatId: li.getAttribute('data-pc-id') || '',
          title: (a.getAttribute('aria-label') || a.textContent || '').trim(),
          click: () => a.click(),
          active: li.classList.contains('checked'),
        });
      });

      if (candidates.length === 0) {
        const fallbackTabs = document.querySelectorAll('.tab');
        fallbackTabs.forEach((tab) => {
          const label = tab.querySelector('.composer-tab-label');
          if (!label) return;
          candidates.push({
            chatId: tab.getAttribute('data-resource-name') || '',
            title: (label.textContent || '').trim(),
            click: () => tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })),
            active: tab.classList.contains('active') || tab.classList.contains('selected'),
          });
        });
      }

      const selected = candidates.find((item) => requestedChatId && item.chatId === requestedChatId)
        || candidates.find((item) => requestedTitle && item.title.toLowerCase().includes(requestedTitle.toLowerCase()));

      if (!selected) {
        return { ok: false, reason: 'chat not found', active: candidates.find((item) => item.active) ?? null };
      }

      selected.click();
      return { ok: true, active: selected };
    })();
  `;
}

export function focusInputSnippet(): string {
  return `
    (() => {
      ${selectorsConst()}
      let editor = null;
      let selectorUsed = null;
      for (const selector of SELECTORS.chatInput) {
        const candidate = document.querySelector(selector);
        if (candidate) {
          editor = candidate;
          selectorUsed = selector;
          break;
        }
      }
      if (!editor) {
        return { ok: false, reason: 'chat input not found' };
      }
      editor.focus();
      if (typeof editor.click === 'function') editor.click();
      const selection = window.getSelection();
      if (selection && editor.firstChild) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return { ok: true, selectorUsed };
    })();
  `;
}

export function clickSendSnippet(): string {
  return `
    (() => {
      ${selectorsConst()}
      for (const selector of SELECTORS.sendButton) {
        const button = document.querySelector(selector);
        if (!button) continue;
        button.click();
        return { ok: true, selectorUsed: selector };
      }
      return { ok: false, reason: 'send button not found' };
    })();
  `;
}

export function latestTurnSnippet(chatId?: string): string {
  return `
    (() => {
      const scopedChatId = ${toJs(chatId ?? null)};
      let scope = document;
      if (scopedChatId && scopedChatId.startsWith('cid-')) {
        const prefix = scopedChatId.slice(4);
        const scoped = document.querySelector('[data-composer-id^="' + prefix + '"]');
        if (scoped) scope = scoped;
      }

      const pairContainers = scope.querySelectorAll('.composer-human-ai-pair-container');
      const last = pairContainers[pairContainers.length - 1];
      if (!last) {
        return {
          userText: null,
          assistantText: null,
          thinkingText: null,
          toolUseSummary: [],
          codeBlocks: [],
          filesMentioned: [],
          isStreaming: false,
          timestamp: new Date().toISOString()
        };
      }

      const userNode = last.querySelector('[data-message-role="human"]');
      const assistantNodes = last.querySelectorAll('[data-message-role="ai"]');
      const thinkingNodes = last.querySelectorAll('[data-message-kind="thinking"]');
      const toolNodes = last.querySelectorAll('[data-message-kind="tool"]');

      const codeBlocks = [];
      last.querySelectorAll('.markdown-block-code pre code').forEach((node) => {
        codeBlocks.push({
          language: node.getAttribute('data-language') || null,
          content: (node.textContent || '').trim()
        });
      });

      const filesMentioned = [];
      last.querySelectorAll('.composer-code-block-filename').forEach((node) => {
        const value = (node.textContent || '').trim();
        if (value) filesMentioned.push(value);
      });

      const assistantParts = [];
      assistantNodes.forEach((node) => {
        const text = (node.textContent || '').trim();
        if (text) assistantParts.push(text);
      });

      const thinkingParts = [];
      thinkingNodes.forEach((node) => {
        const text = (node.textContent || '').trim();
        if (text) thinkingParts.push(text);
      });

      const toolUseSummary = [];
      toolNodes.forEach((node) => {
        const text = (node.textContent || '').trim().replace(/\\s+/g, ' ');
        if (text) toolUseSummary.push(text.slice(0, 500));
      });

      const streamingNode = last.querySelector('.cursorLoadingBackground, [data-is-streaming="true"]');
      return {
        userText: userNode ? (userNode.textContent || '').trim() : null,
        assistantText: assistantParts.length ? assistantParts.join('\\n\\n') : null,
        thinkingText: thinkingParts.length ? thinkingParts.join('\\n\\n') : null,
        toolUseSummary,
        codeBlocks,
        filesMentioned,
        isStreaming: Boolean(streamingNode),
        timestamp: new Date().toISOString()
      };
    })();
  `;
}

export function detectConfirmationsSnippet(): string {
  return `
    (() => {
      const confirmations = [];
      const toolMessages = document.querySelectorAll('[data-message-kind="tool"]');
      toolMessages.forEach((msg, index) => {
        const buttons = Array.from(msg.querySelectorAll('[data-click-ready="true"]')).map((button, buttonIndex) => {
          const label = (button.textContent || '').trim();
          const normalized = label.toLowerCase();
          const action = normalized.includes('reject') || normalized.includes('deny') || normalized.includes('cancel')
            ? 'reject'
            : (normalized.includes('accept') || normalized.includes('run') || normalized.includes('fetch') ? 'accept' : 'unknown');
          return {
            id: String(buttonIndex),
            label,
            action
          };
        });
        if (buttons.length === 0) return;

        const text = (msg.querySelector('.composer-tool-former-message')?.textContent || msg.textContent || '')
          .trim()
          .replace(/\\s+/g, ' ');
        const lower = text.toLowerCase();
        let riskLevel = 'low';
        if (/(delete|drop|reset|force|remove|sudo|rm\\s+-rf)/.test(lower)) {
          riskLevel = 'high';
        } else if (/(write|edit|apply|install|run command)/.test(lower)) {
          riskLevel = 'medium';
        }

        confirmations.push({
          confirmationId: msg.getAttribute('data-tool-call-id') || ('confirmation-' + index),
          type: text.includes('file') ? 'file_edit' : 'tool',
          text,
          buttons,
          riskLevel,
        });
      });
      return confirmations;
    })();
  `;
}

export function actOnConfirmationSnippet(
  confirmationId: string,
  action: "accept" | "reject",
): string {
  return `
    (() => {
      const targetId = ${toJs(confirmationId)};
      const requestedAction = ${toJs(action)};
      const toolMessages = document.querySelectorAll('[data-message-kind="tool"]');
      for (let msgIndex = 0; msgIndex < toolMessages.length; msgIndex += 1) {
        const msg = toolMessages[msgIndex];
        const id = msg.getAttribute('data-tool-call-id') || ('confirmation-' + msgIndex);
        if (id !== targetId) continue;
        const buttons = Array.from(msg.querySelectorAll('[data-click-ready="true"]'));
        const scored = buttons.map((button) => {
          const label = (button.textContent || '').trim().toLowerCase();
          const action = label.includes('reject') || label.includes('deny') || label.includes('cancel')
            ? 'reject'
            : (label.includes('accept') || label.includes('run') || label.includes('fetch') ? 'accept' : 'unknown');
          return { button, action, label };
        });

        const exact = scored.find((item) => item.action === requestedAction);
        if (!exact) {
          return { ok: false, reason: 'no matching button found for action', available: scored.map((s) => s.label) };
        }

        exact.button.click();
        return { ok: true, label: exact.label, confirmationId: targetId };
      }
      return { ok: false, reason: 'confirmation not found' };
    })();
  `;
}
