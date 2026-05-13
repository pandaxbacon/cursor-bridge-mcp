import type { CursorConfirmation } from "../cdp/CdpTypes.js";

function riskFromText(text: string): "low" | "medium" | "high" {
  const lower = text.toLowerCase();
  if (/(rm\s+-rf|drop|delete|force|reset|sudo|chmod|chown)/.test(lower)) {
    return "high";
  }
  if (/(write|edit|apply|install|run|execute|command)/.test(lower)) {
    return "medium";
  }
  return "low";
}

export function detectConfirmationsFromHtml(html: string): CursorConfirmation[] {
  const confirmations: CursorConfirmation[] = [];
  const toolRegex = /data-message-kind="tool"[\s\S]*?(?=data-message-kind="tool"|$)/gi;
  let toolMatch: RegExpExecArray | null;
  let index = 0;
  while ((toolMatch = toolRegex.exec(html)) !== null) {
    const block = toolMatch[0];
    const buttonRegex = /<button[^>]*data-click-ready="true"[^>]*>([\s\S]*?)<\/button>/gi;
    const buttons: CursorConfirmation["buttons"] = [];
    let buttonMatch: RegExpExecArray | null;
    let buttonIndex = 0;
    while ((buttonMatch = buttonRegex.exec(block)) !== null) {
      const label = (buttonMatch[1] ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const lower = label.toLowerCase();
      const action =
        lower.includes("reject") || lower.includes("deny") || lower.includes("cancel")
          ? "reject"
          : lower.includes("accept") || lower.includes("run") || lower.includes("fetch")
            ? "accept"
            : "unknown";
      buttons.push({
        id: String(buttonIndex++),
        label,
        action,
      });
    }
    if (buttons.length === 0) {
      index += 1;
      continue;
    }
    const text = block
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    confirmations.push({
      confirmationId: `confirmation-${index++}`,
      type: text.toLowerCase().includes("file") ? "file_edit" : "tool",
      text,
      buttons,
      riskLevel: riskFromText(text),
    });
  }
  return confirmations;
}
