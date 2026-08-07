export interface KeyDerivation {
  algorithm: "pbkdf2-hmac-sha-256";
  passwordEncoding: "utf-8";
  iterations: number;
  outputLengthBits: 256;
  saltB64Url: string;
}

export interface Cipher {
  algorithm: "aes-gcm";
  keyLengthBits: 256;
  ivB64Url: string;
  tagLengthBits: 128;
  ciphertextAndTagB64Url: string;
}

export interface Document {
  format: "keymaster";
  version: 2;
  label: string;
  publicKeyHex: string;
  keyDerivation: KeyDerivation;
  cipher: Cipher;
}

export interface KeyDerivationParameters {
  algorithm: "pbkdf2-hmac-sha-256";
  passwordEncoding: "utf-8";
  iterations: number;
  outputLengthBits: 256;
}

export interface CipherParameters {
  algorithm: "aes-gcm";
  keyLengthBits: 256;
  tagLengthBits: 128;
}

export interface RecommendedParameters {
  keyDerivation: KeyDerivationParameters;
  cipher: CipherParameters;
}

export interface EncryptedStateInput {
  label: string;
  publicKeyHex: string;
  keyDerivation: KeyDerivationParameters & { salt: Uint8Array };
  cipher: CipherParameters & { iv: Uint8Array; ciphertextAndTag: Uint8Array };
}

export interface PrivateKeyExportInput {
  privateKey: Uint8Array;
  password: string;
  label: string;
  parameters: RecommendedParameters;
}

export interface UnlockResult {
  privateKey: Uint8Array;
  publicKeyHex: string;
}

export interface DocumentSummary {
  format: "keymaster";
  version: 2;
  label: string;
  publicKeyHex: string;
}
