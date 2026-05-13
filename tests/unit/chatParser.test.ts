import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseCodeBlocksFromHtml,
  parseFilesMentionedFromHtml,
} from "../../src/cursor/CursorChatParser.js";

describe("CursorChatParser", () => {
  it("extracts code blocks and filenames from html fixtures", () => {
    const html = fs.readFileSync(
      path.join(process.cwd(), "tests/fixtures/sample-turn.html"),
      "utf8",
    );
    const codeBlocks = parseCodeBlocksFromHtml(html);
    const files = parseFilesMentionedFromHtml(html);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]?.content).toContain('console.log("hello")');
    expect(files).toContain("src/index.ts");
  });
});
