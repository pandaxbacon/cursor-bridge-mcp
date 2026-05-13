export class BridgeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CDP_UNAVAILABLE"
      | "TARGET_NOT_FOUND"
      | "TARGET_AMBIGUOUS"
      | "DOM_ERROR"
      | "SAFETY_BLOCKED"
      | "INVALID_INPUT"
      | "TIMEOUT"
      | "INTERNAL",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

export function toErrorResult(error: unknown): {
  message: string;
  code: string;
  details?: unknown;
} {
  if (error instanceof BridgeError) {
    return { message: error.message, code: error.code, details: error.details };
  }
  if (error instanceof Error) {
    return { message: error.message, code: "INTERNAL" };
  }
  return { message: "Unknown error", code: "INTERNAL" };
}
