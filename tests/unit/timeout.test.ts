import { describe, expect, it } from "vitest";
import { pollUntilStable } from "../../src/utils/timeout.js";

describe("pollUntilStable", () => {
  it("returns non-timeout when state stabilizes", async () => {
    const values = [1, 2, 2, 2];
    let idx = 0;
    const result = await pollUntilStable(
      async () => values[Math.min(idx++, values.length - 1)] ?? 2,
      (prev, next) => prev === next,
      {
        timeoutMs: 1_000,
        intervalMs: 50,
        quietPeriodMs: 100,
      },
    );
    expect(result.timedOut).toBe(false);
    expect(result.result).toBe(2);
  });
});
