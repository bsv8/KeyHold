import {
  CIPHERTEXT_AND_TAG_LENGTH_BYTES,
  IV_LENGTH_BYTES,
  KEY_LENGTH_BITS,
  PRIVATE_KEY_LENGTH_BYTES,
  TAG_LENGTH_BITS,
} from "./constants.js";
import { keyHoldError } from "./errors.js";

function provider(): Crypto {
  if (!globalThis.crypto?.subtle)
    throw keyHoldError("unsupported_algorithm", "WebCrypto is unavailable");
  return globalThis.crypto;
}
function source(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}
export function randomBytes(length: number): Uint8Array {
  try {
    const bytes = new Uint8Array(length);
    provider().getRandomValues(bytes);
    return bytes;
  } catch (cause) {
    throw keyHoldError(
      "invalid_parameter",
      "secure random source failed",
      cause,
    );
  }
}

export async function encryptAesGcm(
  keyBytes: Uint8Array,
  plaintext: Uint8Array,
  iv: Uint8Array,
): Promise<Uint8Array> {
  if (
    keyBytes.length !== KEY_LENGTH_BITS / 8 ||
    plaintext.length !== PRIVATE_KEY_LENGTH_BYTES ||
    iv.length !== IV_LENGTH_BYTES
  )
    throw keyHoldError("invalid_parameter", "AES-GCM input length");
  const key = await provider().subtle.importKey(
    "raw",
    source(keyBytes),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const encrypted = new Uint8Array(
    await provider().subtle.encrypt(
      { name: "AES-GCM", iv: source(iv), tagLength: TAG_LENGTH_BITS },
      key,
      source(plaintext),
    ),
  );
  if (encrypted.length !== CIPHERTEXT_AND_TAG_LENGTH_BYTES)
    throw keyHoldError("invalid_parameter", "unexpected AES-GCM output");
  return encrypted;
}

export async function decryptAesGcm(
  keyBytes: Uint8Array,
  iv: Uint8Array,
  ciphertextAndTag: Uint8Array,
): Promise<Uint8Array> {
  if (
    keyBytes.length !== KEY_LENGTH_BITS / 8 ||
    iv.length !== IV_LENGTH_BYTES ||
    ciphertextAndTag.length !== CIPHERTEXT_AND_TAG_LENGTH_BYTES
  )
    throw keyHoldError("unlock_failed", "AES-GCM input length");
  const key = await provider().subtle.importKey(
    "raw",
    source(keyBytes),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  try {
    const plaintext = new Uint8Array(
      await provider().subtle.decrypt(
        { name: "AES-GCM", iv: source(iv), tagLength: TAG_LENGTH_BITS },
        key,
        source(ciphertextAndTag),
      ),
    );
    if (plaintext.length !== PRIVATE_KEY_LENGTH_BYTES)
      throw keyHoldError("unlock_failed", "invalid decrypted private key");
    return plaintext;
  } catch (cause) {
    throw keyHoldError("unlock_failed", "cipher authentication failed", cause);
  }
}
