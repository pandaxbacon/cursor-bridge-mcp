import { describe, expect, it } from "vitest";
import { toolTargetSelectorSchema } from "../../src/mcp/tools/shared.js";

describe("toolTargetSelectorSchema", () => {
  it("accepts targetId selector", () => {
    const parsed = toolTargetSelectorSchema.parse({ targetId: "abc" });
    expect(parsed.targetId).toBe("abc");
  });

  it("rejects empty selector", () => {
    expect(() => toolTargetSelectorSchema.parse({})).toThrow();
  });
});
