import type { Cipher, Document, KeyDerivation } from "./model.js";
import {
  decodeBase64Url,
  decodeHex,
  hasUnicodeScalarSequence,
} from "./encoding.js";
import { keyHoldError } from "./errors.js";
import {
  CIPHER_ALGORITHM,
  CIPHERTEXT_AND_TAG_LENGTH_BYTES,
  FORMAT,
  IV_LENGTH_BYTES,
  KDF_ALGORITHM,
  KEY_LENGTH_BITS,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
  OUTPUT_LENGTH_BITS,
  PASSWORD_ENCODING,
  PUBLIC_KEY_LENGTH_BYTES,
  SALT_LENGTH_BYTES,
  TAG_LENGTH_BITS,
  VERSION,
} from "./constants.js";
import { validatePublicKeyHex } from "./secp256k1.js";

type ObjectValue = Record<string, unknown>;

function object(value: unknown, name: string): ObjectValue {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw keyHoldError("invalid_document", `${name} must be an object`);
  return value as ObjectValue;
}

function exact(value: unknown, keys: string[], name: string): ObjectValue {
  const result = object(value, name);
  for (const key of Object.keys(result))
    if (!keys.includes(key))
      throw keyHoldError("invalid_document", `${name}.${key} is not allowed`);
  for (const key of keys)
    if (!(key in result))
      throw keyHoldError("invalid_document", `${name}.${key} is required`);
  return result;
}

function string(value: unknown, name: string, nonEmpty = false): string {
  if (
    typeof value !== "string" ||
    !hasUnicodeScalarSequence(value) ||
    (nonEmpty && value.length === 0)
  ) {
    throw keyHoldError("invalid_document", `${name} must be a valid string`);
  }
  return value;
}

function integer(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw keyHoldError("invalid_document", `${name} must be an integer`);
  return value;
}

function constant(
  value: unknown,
  expected: string | number,
  name: string,
): void {
  if (value !== expected) {
    const code =
      name === "format"
        ? "unsupported_format"
        : name === "version"
          ? "unsupported_version"
          : name.endsWith(".algorithm")
            ? "unsupported_algorithm"
            : "invalid_document";
    throw keyHoldError(code, `${name} must be ${String(expected)}`);
  }
}

function kdf(value: unknown): KeyDerivation {
  const k = exact(
    value,
    [
      "algorithm",
      "passwordEncoding",
      "iterations",
      "outputLengthBits",
      "saltB64Url",
    ],
    "keyDerivation",
  );
  constant(k.algorithm, KDF_ALGORITHM, "keyDerivation.algorithm");
  constant(
    k.passwordEncoding,
    PASSWORD_ENCODING,
    "keyDerivation.passwordEncoding",
  );
  const iterations = integer(k.iterations, "keyDerivation.iterations");
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS)
    throw keyHoldError("invalid_document", "iterations out of range");
  constant(
    k.outputLengthBits,
    OUTPUT_LENGTH_BITS,
    "keyDerivation.outputLengthBits",
  );
  const saltB64Url = string(k.saltB64Url, "keyDerivation.saltB64Url");
  try {
    if (
      decodeBase64Url(saltB64Url, "keyDerivation.saltB64Url").length !==
      SALT_LENGTH_BYTES
    )
      throw keyHoldError("invalid_document", "salt must be 16 bytes");
  } catch (cause) {
    if (
      cause instanceof Error &&
      "code" in cause &&
      (cause as { code?: unknown }).code === "invalid_document"
    )
      throw cause;
    throw keyHoldError("invalid_document", "invalid salt", cause);
  }
  return {
    algorithm: KDF_ALGORITHM,
    passwordEncoding: PASSWORD_ENCODING,
    iterations,
    outputLengthBits: OUTPUT_LENGTH_BITS,
    saltB64Url,
  };
}

function cipher(value: unknown): Cipher {
  const c = exact(
    value,
    [
      "algorithm",
      "keyLengthBits",
      "ivB64Url",
      "tagLengthBits",
      "ciphertextAndTagB64Url",
    ],
    "cipher",
  );
  constant(c.algorithm, CIPHER_ALGORITHM, "cipher.algorithm");
  constant(c.keyLengthBits, KEY_LENGTH_BITS, "cipher.keyLengthBits");
  constant(c.tagLengthBits, TAG_LENGTH_BITS, "cipher.tagLengthBits");
  const ivB64Url = string(c.ivB64Url, "cipher.ivB64Url");
  const ciphertextAndTagB64Url = string(
    c.ciphertextAndTagB64Url,
    "cipher.ciphertextAndTagB64Url",
  );
  try {
    if (decodeBase64Url(ivB64Url, "cipher.ivB64Url").length !== IV_LENGTH_BYTES)
      throw keyHoldError("invalid_document", "IV must be 12 bytes");
    if (
      decodeBase64Url(ciphertextAndTagB64Url, "cipher.ciphertextAndTagB64Url")
        .length !== CIPHERTEXT_AND_TAG_LENGTH_BYTES
    )
      throw keyHoldError(
        "invalid_document",
        "ciphertextAndTag must be 48 bytes",
      );
  } catch (cause) {
    if (
      cause instanceof Error &&
      "code" in cause &&
      (cause as { code?: unknown }).code === "invalid_document"
    )
      throw cause;
    throw keyHoldError("invalid_document", "invalid cipher bytes", cause);
  }
  return {
    algorithm: CIPHER_ALGORITHM,
    keyLengthBits: KEY_LENGTH_BITS,
    ivB64Url,
    tagLengthBits: TAG_LENGTH_BITS,
    ciphertextAndTagB64Url,
  };
}

/** Validate an in-memory value and return the normalized KeyHold document. */
export function validateDocument(value: unknown): Document {
  const d = exact(
    value,
    ["format", "version", "label", "publicKeyHex", "keyDerivation", "cipher"],
    "document",
  );
  constant(d.format, FORMAT, "format");
  constant(d.version, VERSION, "version");
  const label = string(d.label, "label", true);
  const publicKeyHex = string(d.publicKeyHex, "publicKeyHex");
  if (publicKeyHex.length !== PUBLIC_KEY_LENGTH_BYTES * 2)
    throw keyHoldError("invalid_document", "publicKeyHex must be 33 bytes");
  try {
    validatePublicKeyHex(publicKeyHex);
  } catch (cause) {
    throw keyHoldError("invalid_document", "invalid public key", cause);
  }
  return {
    format: FORMAT,
    version: VERSION,
    label,
    publicKeyHex,
    keyDerivation: kdf(d.keyDerivation),
    cipher: cipher(d.cipher),
  };
}

function scanJson(text: string): void {
  let index = 0;
  const whitespace = () => {
    while (/\s/.test(text[index] ?? "")) index += 1;
  };
  const fail = (): never => {
    throw keyHoldError("invalid_json", "document is not valid JSON");
  };
  const parseString = (): string => {
    const start = index;
    if (text[index++] !== '"') fail();
    let escaped = false;
    while (index < text.length) {
      const character = text[index++] ?? "";
      if (escaped) {
        if (character === "u") index += 4;
        else if (!'"\\/bfnrt'.includes(character)) fail();
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === '"') {
        const raw = text.slice(start, index);
        try {
          const value: unknown = JSON.parse(raw);
          if (typeof value !== "string") return fail();
          if (!hasUnicodeScalarSequence(value)) return fail();
          return value;
        } catch {
          return fail();
        }
      }
      if (character < " ") fail();
    }
    return fail();
  };
  const value = (): void => {
    whitespace();
    const character = text[index] ?? "";
    if (character === '"') {
      parseString();
      return;
    }
    if (character === "{") {
      objectValue();
      return;
    }
    if (character === "[") {
      arrayValue();
      return;
    }
    if (character === "t" && text.slice(index, index + 4) === "true") {
      index += 4;
      return;
    }
    if (character === "f" && text.slice(index, index + 5) === "false") {
      index += 5;
      return;
    }
    if (character === "n" && text.slice(index, index + 4) === "null") {
      index += 4;
      return;
    }
    if (
      character === "-" ||
      (character !== undefined && character >= "0" && character <= "9")
    ) {
      const start = index;
      if (text[index] === "-") index += 1;
      if (text[index] === "0") index += 1;
      else {
        if (!/[1-9]/.test(text[index] ?? "")) fail();
        while (/[0-9]/.test(text[index] ?? "")) index += 1;
      }
      if (text[index] === ".") {
        fail();
      }
      if (text[index] === "e" || text[index] === "E") fail();
      if (index === start || (text[index - 1] === "-" && index === start + 1))
        fail();
      return;
    }
    fail();
  };
  const objectValue = (): void => {
    index += 1;
    whitespace();
    const keys = new Set<string>();
    if (text[index] === "}") {
      index += 1;
      return;
    }
    while (true) {
      whitespace();
      const key = parseString();
      if (keys.has(key)) fail();
      keys.add(key);
      whitespace();
      if (text[index++] !== ":") fail();
      value();
      whitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      if (text[index++] !== ",") fail();
    }
  };
  const arrayValue = (): void => {
    index += 1;
    whitespace();
    if (text[index] === "]") {
      index += 1;
      return;
    }
    while (true) {
      value();
      whitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      if (text[index++] !== ",") fail();
    }
  };
  value();
  whitespace();
  if (index !== text.length) fail();
}

/** Parse JSON text or UTF-8 bytes and validate the resulting document. */
export function parseDocument(input: string | Uint8Array): Document {
  let text: string;
  if (input instanceof Uint8Array) {
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(input);
    } catch (cause) {
      throw keyHoldError("invalid_json", "document is not valid UTF-8", cause);
    }
  } else if (typeof input === "string") {
    text = input;
  } else {
    throw keyHoldError("invalid_json", "document must be UTF-8 JSON text");
  }
  try {
    scanJson(text);
    return validateDocument(JSON.parse(text) as unknown);
  } catch (cause) {
    if (
      cause instanceof Error &&
      "code" in cause &&
      (cause as { code?: unknown }).code !== "invalid_json"
    )
      throw cause;
    throw keyHoldError("invalid_json", "document is not valid JSON", cause);
  }
}

export function validateCipher(value: unknown): void {
  cipher(value);
}
