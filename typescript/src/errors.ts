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

export type ErrorCode = (typeof ERROR_CODES)[number];

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

export function isKeyHoldError(value: unknown): value is KeyHoldError {
  return value instanceof KeyHoldError;
}
