import { describe, expect, it } from "vitest";
import { CursorBridge } from "../../src/cursor/CursorBridge.js";

const enabled = process.env.RUN_CURSOR_INTEGRATION === "1";
const maybeDescribe = enabled ? describe : describe.skip;

maybeDescribe("Cursor CDP integration", () => {
  const bridge = new CursorBridge();

  it("runs health check", async () => {
    const health = await bridge.healthCheck();
    expect(health.cdpReachable).toBe(true);
  });

  it("lists windows and can describe first window", async () => {
    const windows = await bridge.listWindows();
    expect(windows.length).toBeGreaterThan(0);
    const first = windows[0];
    if (!first) {
      return;
    }
    const info = await bridge.describeWindow({
      target: { targetId: first.targetId },
    });
    expect(info.window.targetId).toBe(first.targetId);
  });

  it("captures screenshot and does non-submitting insert", async () => {
    const windows = await bridge.listWindows();
    const first = windows[0];
    if (!first) {
      return;
    }
    const screenshot = await bridge.screenshot({
      target: { targetId: first.targetId },
    });
    expect(screenshot.base64.length).toBeGreaterThan(10);

    const result = await bridge.sendMessage({
      target: { targetId: first.targetId },
      text: "[integration-test] dry run insert",
      submit: false,
    });
    expect(result.submitted).toBe(false);
  });
});
