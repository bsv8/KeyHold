import { decodeBase64Url, utf8 } from "./encoding.js";
import type { KeyDerivationParameters } from "./model.js";
import { keyHoldError } from "./errors.js";
import {
  KDF_ALGORITHM,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
  OUTPUT_LENGTH_BITS,
  PASSWORD_ENCODING,
} from "./constants.js";

export async function derivePassword(
  password: string,
  salt: Uint8Array,
  parameters: KeyDerivationParameters,
): Promise<Uint8Array> {
  if (password.length === 0)
    throw keyHoldError("invalid_parameter", "password must not be empty");
  const passwordBytes = utf8(password);
  if (
    parameters.algorithm !== KDF_ALGORITHM ||
    parameters.passwordEncoding !== PASSWORD_ENCODING ||
    parameters.outputLengthBits !== OUTPUT_LENGTH_BITS ||
    !Number.isSafeInteger(parameters.iterations) ||
    parameters.iterations < MIN_ITERATIONS ||
    parameters.iterations > MAX_ITERATIONS
  )
    throw keyHoldError(
      "invalid_parameter",
      "invalid key derivation parameters",
    );
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    passwordBytes as unknown as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await globalThis.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as unknown as BufferSource,
        iterations: parameters.iterations,
        hash: "SHA-256",
      },
      key,
      OUTPUT_LENGTH_BITS,
    ),
  );
}

export function saltFromDocument(value: string): Uint8Array {
  return decodeBase64Url(value, "keyDerivation.saltB64Url");
}
