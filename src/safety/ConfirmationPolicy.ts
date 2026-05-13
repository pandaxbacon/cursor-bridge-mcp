import type { BridgeConfig } from "../config/schema.js";
import type { CursorConfirmation } from "../cdp/CdpTypes.js";

export interface ConfirmationDecision {
  allowed: boolean;
  reason: string;
}

export class ConfirmationPolicy {
  constructor(private readonly config: BridgeConfig) {}

  canApplyAction(
    confirmation: CursorConfirmation,
    action: "accept" | "reject",
  ): ConfirmationDecision {
    if (action === "reject") {
      return { allowed: true, reason: "reject is always allowed" };
    }

    const safety = this.config.safety.confirmationActions;
    if (confirmation.riskLevel === "high" && !safety.allowAcceptForHighRisk) {
      return {
        allowed: false,
        reason: "high risk confirmations require explicit deny policy override",
      };
    }
    if (confirmation.riskLevel === "medium" && !safety.allowAcceptForMediumRisk) {
      return {
        allowed: false,
        reason: "medium risk confirmations are blocked by default policy",
      };
    }
    if (confirmation.riskLevel === "low" && !safety.allowAcceptForLowRisk) {
      return {
        allowed: false,
        reason: "low risk confirmations are blocked by policy",
      };
    }

    return { allowed: true, reason: "allowed by policy" };
  }
}
