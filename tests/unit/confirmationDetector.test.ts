import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectConfirmationsFromHtml } from "../../src/cursor/CursorConfirmationDetector.js";

describe("CursorConfirmationDetector", () => {
  it("detects confirmation and assigns risk level", () => {
    const html = fs.readFileSync(
      path.join(process.cwd(), "tests/fixtures/sample-confirmation.html"),
      "utf8",
    );
    const confirmations = detectConfirmationsFromHtml(html);
    expect(confirmations).toHaveLength(1);
    expect(confirmations[0]?.riskLevel).toBe("high");
    expect(confirmations[0]?.buttons.map((button) => button.label)).toContain("Run");
  });
});
