/** Stable error codes exposed by the KeyHold SDK. */
export const ERROR_CODES = [
  "invalid_json",
  "unsupported_format",
  "unsupported_version",
  "invalid_document",
  "unsupported_algorithm",
  "invalid_parameter",
  "invalid_private_key",
  "unlock_failed",
] as const;

/** A stable category of KeyHold failure. */
export type ErrorCode = (typeof ERROR_CODES)[number];

/** Error thrown by public SDK operations. */
export class KeyHoldError extends Error {
  readonly name = "KeyHoldError";
  constructor(
    public readonly code: ErrorCode,
    message: string = code,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** Construct a KeyHold error while preserving an optional underlying cause. */
export function keyHoldError(
  code: ErrorCode,
  message: string = code,
  cause?: unknown,
): KeyHoldError {
  return new KeyHoldError(
    code,
    message,
    cause === undefined ? undefined : { cause },
  );
}

/** Return true when a value is a KeyHold SDK error. */
export function isKeyHoldError(value: unknown): value is KeyHoldError {
  return value instanceof KeyHoldError;
}
