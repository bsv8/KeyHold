import type { Document, DocumentSummary, UnlockResult } from "./model.js";
import { decodeBase64Url, encodeHex } from "./encoding.js";
import { validateDocument, parseDocument } from "./validation.js";
import { publicKeyFromPrivate, publicKeyMatches } from "./secp256k1.js";
import { derivePassword, saltFromDocument } from "./password.js";
import { decryptAesGcm } from "./aesGcm.js";
import { keyHoldError } from "./errors.js";

export { parseDocument };

export function serializeDocument(document: Document): string {
  return JSON.stringify(validateDocument(document));
}
export function summary(document: Document): DocumentSummary {
  const value = validateDocument(document);
  return {
    format: value.format,
    version: value.version,
    label: value.label,
    publicKeyHex: value.publicKeyHex,
  };
}

export async function unlockDocument(
  document: Document,
  password: string,
): Promise<UnlockResult> {
  const value = validateDocument(document);
  try {
    const key = await derivePassword(
      password,
      saltFromDocument(value.keyDerivation.saltB64Url),
      value.keyDerivation,
    );
    const plaintext = await decryptAesGcm(
      key,
      decodeBase64Url(value.cipher.ivB64Url),
      decodeBase64Url(value.cipher.ciphertextAndTagB64Url),
    );
    if (!publicKeyMatches(plaintext, value.publicKeyHex))
      throw keyHoldError(
        "unlock_failed",
        "private key does not match document public key",
      );
    return {
      privateKey: plaintext,
      publicKeyHex: encodeHex(publicKeyFromPrivate(plaintext)),
    };
  } catch (cause) {
    throw keyHoldError("unlock_failed", "unable to unlock document", cause);
  }
}

export const parse = parseDocument;
export const validate = validateDocument;
export const serialize = serializeDocument;
export const unlock = unlockDocument;
