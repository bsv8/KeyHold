/** A validated KeyHold key-derivation section. */
export interface KeyDerivation {
  algorithm: "pbkdf2-hmac-sha-256";
  passwordEncoding: "utf-8";
  iterations: number;
  outputLengthBits: 256;
  saltB64Url: string;
}

/** A validated KeyHold cipher section. */
export interface Cipher {
  algorithm: "aes-gcm";
  keyLengthBits: 256;
  ivB64Url: string;
  tagLengthBits: 128;
  ciphertextAndTagB64Url: string;
}

/** The complete JSON document represented by the SDK. */
export interface Document {
  format: "keymaster";
  version: 2;
  label: string;
  publicKeyHex: string;
  keyDerivation: KeyDerivation;
  cipher: Cipher;
}

/** Explicit parameters for PBKDF2 during private-key export. */
export interface KeyDerivationParameters {
  algorithm: "pbkdf2-hmac-sha-256";
  passwordEncoding: "utf-8";
  iterations: number;
  outputLengthBits: 256;
}

/** Explicit parameters for AES-GCM during private-key export. */
export interface CipherParameters {
  algorithm: "aes-gcm";
  keyLengthBits: 256;
  tagLengthBits: 128;
}

/** The complete parameter set required by private-key export. */
export interface RecommendedParameters {
  keyDerivation: KeyDerivationParameters;
  cipher: CipherParameters;
}

/** Already-encrypted state that can be serialized without decryption. */
export interface EncryptedStateInput {
  label: string;
  publicKeyHex: string;
  keyDerivation: KeyDerivationParameters & { salt: Uint8Array };
  cipher: CipherParameters & { iv: Uint8Array; ciphertextAndTag: Uint8Array };
}

/** Plaintext private-key input used to create a new encrypted document. */
export interface PrivateKeyExportInput {
  privateKey: Uint8Array;
  password: string;
  label: string;
  parameters: RecommendedParameters;
}

/** The private key and public key recovered after a successful unlock. */
export interface UnlockResult {
  privateKey: Uint8Array;
  publicKeyHex: string;
}

/** Public, non-secret metadata extracted from a document. */
export interface DocumentSummary {
  format: "keymaster";
  version: 2;
  label: string;
  publicKeyHex: string;
}
