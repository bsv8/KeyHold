import { describe, expect, it } from "vitest";
import { decodeBase64Url, decodeHex } from "../src/encoding.js";
import {
  exportEncryptedState,
  exportPrivateKeyWithRandom,
  recommendedParameters,
} from "../src/export.js";
import { parseDocument } from "../src/validation.js";
import { fixture, jsonFixture } from "./helpers.js";

describe("shared export vector", () => {
  it("produces the exact document consumed by both SDKs", async () => {
    const vector = jsonFixture<{
      privateKeyHex: string;
      password: string;
      label: string;
      iterations: number;
      saltB64Url: string;
      ivB64Url: string;
      ciphertextAndTagB64Url: string;
    }>("vectors/export-equivalence.json");
    const parameters = {
      ...recommendedParameters(),
      keyDerivation: {
        ...recommendedParameters().keyDerivation,
        iterations: vector.iterations,
      },
    };
    const salt = decodeBase64Url(vector.saltB64Url);
    const iv = decodeBase64Url(vector.ivB64Url);
    const privateKey = decodeHex(vector.privateKeyHex);
    const json = await exportPrivateKeyWithRandom(
      {
        privateKey,
        password: vector.password,
        label: vector.label,
        parameters,
      },
      salt,
      iv,
    );
    expect(json).toBe(fixture("valid/basic.json").trim());
    const document = parseDocument(json);
    expect(
      exportEncryptedState({
        label: document.label,
        publicKeyHex: document.publicKeyHex,
        keyDerivation: { ...parameters.keyDerivation, salt },
        cipher: {
          ...parameters.cipher,
          iv,
          ciphertextAndTag: decodeBase64Url(vector.ciphertextAndTagB64Url),
        },
      }),
    ).toBe(json);
  });
});
