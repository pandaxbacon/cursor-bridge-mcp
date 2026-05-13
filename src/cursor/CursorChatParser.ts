import type { CursorCodeBlock, CursorTurn } from "../cdp/CdpTypes.js";

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseCodeBlocksFromHtml(html: string): CursorCodeBlock[] {
  const blocks: CursorCodeBlock[] = [];
  const regex = /<code(?:[^>]*data-language="([^"]+)")?[^>]*>([\s\S]*?)<\/code>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    blocks.push({
      language: match[1] ?? null,
      content: decodeHtml(stripTags(match[2] ?? "")),
    });
  }
  return blocks;
}

export function parseFilesMentionedFromHtml(html: string): string[] {
  const files: string[] = [];
  const regex = /composer-code-block-filename[^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const value = decodeHtml(stripTags(match[1] ?? ""));
    if (value) {
      files.push(value);
    }
  }
  return files;
}

export function buildAssistantText(turn: CursorTurn): string {
  const parts = [turn.assistantText, turn.thinkingText].filter((value): value is string =>
    Boolean(value && value.trim()),
  );
  return parts.join("\n\n");
}
