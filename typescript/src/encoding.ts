import { keyHoldError } from "./errors.js";

const base64Alphabet = /^[A-Za-z0-9_-]*$/;

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodeBase64Url(
  value: unknown,
  field = "base64url",
): Uint8Array {
  if (
    typeof value !== "string" ||
    !base64Alphabet.test(value) ||
    value.length % 4 === 1
  ) {
    throw keyHoldError("invalid_document", `invalid ${field}`);
  }
  let binary: string;
  try {
    const padded =
      value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - (value.length % 4)) % 4);
    binary = atob(padded);
  } catch (cause) {
    throw keyHoldError("invalid_document", `invalid ${field}`, cause);
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (encodeBase64Url(bytes) !== value)
    throw keyHoldError("invalid_document", `non-canonical ${field}`);
  return bytes;
}

export function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function decodeHex(value: unknown, field = "hex"): Uint8Array {
  if (
    typeof value !== "string" ||
    value.length % 2 !== 0 ||
    !/^[0-9a-f]*$/.test(value)
  ) {
    throw keyHoldError("invalid_document", `invalid ${field}`);
  }
  const result = new Uint8Array(value.length / 2);
  for (let i = 0; i < result.length; i += 1)
    result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return result;
}

export function hasUnicodeScalarSequence(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

export function utf8(value: string): Uint8Array {
  if (!hasUnicodeScalarSequence(value))
    throw keyHoldError(
      "invalid_parameter",
      "text contains an unpaired surrogate",
    );
  return new TextEncoder().encode(value);
}
