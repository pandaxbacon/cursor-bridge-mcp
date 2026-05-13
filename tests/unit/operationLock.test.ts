import { describe, expect, it } from "vitest";
import { OperationLock } from "../../src/safety/OperationLock.js";
import { delay } from "../../src/utils/timeout.js";

describe("OperationLock", () => {
  it("serializes operations for same key", async () => {
    const lock = new OperationLock();
    const events: string[] = [];

    const task = async (name: string) => {
      const unlock = await lock.acquire("same");
      events.push(`${name}-start`);
      await delay(20);
      events.push(`${name}-end`);
      unlock();
    };

    await Promise.all([task("a"), task("b")]);
    expect(events).toEqual(["a-start", "a-end", "b-start", "b-end"]);
  });
});
