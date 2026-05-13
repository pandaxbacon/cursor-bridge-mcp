import type { CursorWindowInfo } from "../cdp/CdpTypes.js";
import type { BridgeConfig, TargetSelectorInput } from "../config/schema.js";
import { BridgeError } from "../utils/errors.js";

export interface ResolvedTarget {
  target: CursorWindowInfo;
  reason: string;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export function resolveTarget(
  selector: TargetSelectorInput,
  windows: CursorWindowInfo[],
  config: BridgeConfig,
): ResolvedTarget {
  if (selector.targetId) {
    const direct = windows.find((window) => window.targetId === selector.targetId);
    if (!direct) {
      throw new BridgeError(
        `No window found for targetId=${selector.targetId}`,
        "TARGET_NOT_FOUND",
      );
    }
    return { target: direct, reason: "matched targetId" };
  }

  let derivedSelector = selector;
  if (selector.workspaceAlias) {
    const alias = config.aliases[selector.workspaceAlias];
    if (!alias) {
      throw new BridgeError(
        `Unknown workspace alias: ${selector.workspaceAlias}`,
        "TARGET_NOT_FOUND",
      );
    }
    derivedSelector = {
      ...selector,
      workspacePath: alias.workspacePath,
      titleContains: selector.titleContains ?? alias.titleContains,
    };
  }

  let matches = windows;
  if (derivedSelector.workspacePath) {
    const wanted = normalize(derivedSelector.workspacePath);
    matches = matches.filter((window) => normalize(window.workspacePath).includes(wanted));
  }
  if (derivedSelector.titleContains) {
    const wanted = normalize(derivedSelector.titleContains);
    matches = matches.filter((window) => normalize(window.title).includes(wanted));
  }

  if (matches.length === 0) {
    throw new BridgeError("No window matched selector", "TARGET_NOT_FOUND", {
      selector: derivedSelector,
    });
  }
  if (matches.length > 1) {
    throw new BridgeError("Selector matched multiple windows", "TARGET_AMBIGUOUS", {
      selector: derivedSelector,
      candidates: matches.map((item) => ({
        targetId: item.targetId,
        title: item.title,
        workspacePath: item.workspacePath,
      })),
    });
  }

  const single = matches[0];
  if (!single) {
    throw new BridgeError("No target available after selector filtering", "TARGET_NOT_FOUND");
  }
  return { target: single, reason: "matched workspace/title selector" };
}
