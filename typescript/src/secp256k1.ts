import { secp256k1 } from "@noble/curves/secp256k1.js";
import { decodeHex, encodeHex } from "./encoding.js";
import { keyHoldError } from "./errors.js";
import {
  PRIVATE_KEY_LENGTH_BYTES,
  PUBLIC_KEY_LENGTH_BYTES,
} from "./constants.js";

export function publicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  if (
    privateKey.length !== PRIVATE_KEY_LENGTH_BYTES ||
    !secp256k1.utils.isValidSecretKey(privateKey)
  )
    throw keyHoldError(
      "invalid_private_key",
      "private key is outside secp256k1 range",
    );
  return secp256k1.getPublicKey(privateKey, true);
}
export function validatePublicKeyHex(value: unknown): Uint8Array {
  const bytes = decodeHex(value, "publicKeyHex");
  if (
    bytes.length !== PUBLIC_KEY_LENGTH_BYTES ||
    (bytes[0] !== 2 && bytes[0] !== 3)
  )
    throw keyHoldError("invalid_document", "invalid compressed public key");
  if (!secp256k1.utils.isValidPublicKey(bytes, true))
    throw keyHoldError("invalid_document", "invalid secp256k1 public key");
  return bytes;
}
export function publicKeyMatches(
  privateKey: Uint8Array,
  publicKeyHex: string,
): boolean {
  return encodeHex(publicKeyFromPrivate(privateKey)) === publicKeyHex;
}
