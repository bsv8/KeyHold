import type {
  Cipher,
  Document,
  EncryptedStateInput,
  KeyDerivation,
  PrivateKeyExportInput,
  RecommendedParameters,
} from "./model.js";
import {
  CIPHER_ALGORITHM,
  CIPHERTEXT_AND_TAG_LENGTH_BYTES,
  IV_LENGTH_BYTES,
  KDF_ALGORITHM,
  KEY_LENGTH_BITS,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
  OUTPUT_LENGTH_BITS,
  PASSWORD_ENCODING,
  RECOMMENDED_ITERATIONS,
  SALT_LENGTH_BYTES,
  TAG_LENGTH_BITS,
} from "./constants.js";
import {
  decodeBase64Url,
  encodeBase64Url,
  encodeHex,
  hasUnicodeScalarSequence,
} from "./encoding.js";
import { keyHoldError } from "./errors.js";
import { validateDocument } from "./validation.js";
import { publicKeyFromPrivate } from "./secp256k1.js";
import { derivePassword } from "./password.js";
import { encryptAesGcm, randomBytes } from "./aesGcm.js";

export function recommendedParameters(): RecommendedParameters {
  return {
    keyDerivation: {
      algorithm: KDF_ALGORITHM,
      passwordEncoding: PASSWORD_ENCODING,
      iterations: RECOMMENDED_ITERATIONS,
      outputLengthBits: OUTPUT_LENGTH_BITS,
    },
    cipher: {
      algorithm: CIPHER_ALGORITHM,
      keyLengthBits: KEY_LENGTH_BITS,
      tagLengthBits: TAG_LENGTH_BITS,
    },
  };
}

function checkParameters(parameters: RecommendedParameters): void {
  if (
    parameters.keyDerivation.algorithm !== KDF_ALGORITHM ||
    parameters.keyDerivation.passwordEncoding !== PASSWORD_ENCODING ||
    parameters.keyDerivation.outputLengthBits !== OUTPUT_LENGTH_BITS ||
    !Number.isSafeInteger(parameters.keyDerivation.iterations) ||
    parameters.keyDerivation.iterations < MIN_ITERATIONS ||
    parameters.keyDerivation.iterations > MAX_ITERATIONS
  )
    throw keyHoldError(
      "invalid_parameter",
      "invalid key derivation parameters",
    );
  if (
    parameters.cipher.algorithm !== CIPHER_ALGORITHM ||
    parameters.cipher.keyLengthBits !== KEY_LENGTH_BITS ||
    parameters.cipher.tagLengthBits !== TAG_LENGTH_BITS
  )
    throw keyHoldError("invalid_parameter", "invalid cipher parameters");
}

function buildDocument(
  label: string,
  publicKeyHex: string,
  keyDerivation: KeyDerivation,
  cipher: Cipher,
): Document {
  return validateDocument({
    format: "keymaster",
    version: 2,
    label,
    publicKeyHex,
    keyDerivation,
    cipher,
  });
}

export function exportEncryptedState(input: EncryptedStateInput): string {
  checkParameters(input);
  if (input.label.length === 0 || !hasUnicodeScalarSequence(input.label))
    throw keyHoldError("invalid_parameter", "label must not be empty");
  if (
    input.keyDerivation.salt.length !== SALT_LENGTH_BYTES ||
    input.cipher.iv.length !== IV_LENGTH_BYTES ||
    input.cipher.ciphertextAndTag.length !== CIPHERTEXT_AND_TAG_LENGTH_BYTES
  )
    throw keyHoldError(
      "invalid_parameter",
      "invalid encrypted state byte length",
    );
  return JSON.stringify(
    buildDocument(
      input.label,
      input.publicKeyHex,
      {
        algorithm: input.keyDerivation.algorithm,
        passwordEncoding: input.keyDerivation.passwordEncoding,
        iterations: input.keyDerivation.iterations,
        outputLengthBits: input.keyDerivation.outputLengthBits,
        saltB64Url: encodeBase64Url(input.keyDerivation.salt),
      },
      {
        algorithm: input.cipher.algorithm,
        keyLengthBits: input.cipher.keyLengthBits,
        tagLengthBits: input.cipher.tagLengthBits,
        ivB64Url: encodeBase64Url(input.cipher.iv),
        ciphertextAndTagB64Url: encodeBase64Url(input.cipher.ciphertextAndTag),
      },
    ),
  );
}

export async function exportPrivateKey(
  input: PrivateKeyExportInput,
): Promise<string> {
  return exportPrivateKeyWithRandom(
    input,
    randomBytes(SALT_LENGTH_BYTES),
    randomBytes(IV_LENGTH_BYTES),
  );
}

export async function exportPrivateKeyWithRandom(
  input: PrivateKeyExportInput,
  salt: Uint8Array,
  iv: Uint8Array,
): Promise<string> {
  checkParameters(input.parameters);
  if (input.label.length === 0 || !hasUnicodeScalarSequence(input.label))
    throw keyHoldError("invalid_parameter", "label must not be empty");
  if (input.password.length === 0 || !hasUnicodeScalarSequence(input.password))
    throw keyHoldError(
      "invalid_parameter",
      "password must be a non-empty Unicode scalar sequence",
    );
  if (salt.length !== SALT_LENGTH_BYTES || iv.length !== IV_LENGTH_BYTES)
    throw keyHoldError("invalid_parameter", "invalid random byte length");
  const publicKeyHex = encodeHex(publicKeyFromPrivate(input.privateKey));
  const key = await derivePassword(
    input.password,
    salt,
    input.parameters.keyDerivation,
  );
  const ciphertextAndTag = await encryptAesGcm(key, input.privateKey, iv);
  return JSON.stringify(
    buildDocument(
      input.label,
      publicKeyHex,
      { ...input.parameters.keyDerivation, saltB64Url: encodeBase64Url(salt) },
      {
        ...input.parameters.cipher,
        ivB64Url: encodeBase64Url(iv),
        ciphertextAndTagB64Url: encodeBase64Url(ciphertextAndTag),
      },
    ),
  );
}
