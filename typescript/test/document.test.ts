import { describe, expect, it } from "vitest";
import {
  exportEncryptedState,
  exportPrivateKey,
  exportPrivateKeyWithRandom,
  recommendedParameters,
} from "../src/export.js";
import { decodeBase64Url } from "../src/encoding.js";
import { parseDocument } from "../src/validation.js";
import { serializeDocument, unlockDocument, summary } from "../src/document.js";

describe("document lifecycle", () => {
  const privateKey = Uint8Array.from({ length: 32 }, (_, i) =>
    i === 31 ? 1 : 0,
  );
  const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
  const iv = Uint8Array.from({ length: 12 }, (_, i) => i + 16);
  it("exports, parses, unlocks and serializes one document", async () => {
    const json = await exportPrivateKeyWithRandom(
      {
        privateKey,
        password: "päss🔑",
        label: "Personal key",
        parameters: {
          ...recommendedParameters(),
          keyDerivation: {
            ...recommendedParameters().keyDerivation,
            iterations: 1000,
          },
        },
      },
      salt,
      iv,
    );
    const document = parseDocument(json);
    const result = await unlockDocument(document, "päss🔑");
    expect(result.privateKey).toEqual(privateKey);
    expect(summary(document).label).toBe("Personal key");
    expect(serializeDocument(document)).toBe(json);
  });
  it("does not accept omitted parameters at the API boundary", async () => {
    await expect(
      exportPrivateKey({
        privateKey,
        password: "secret",
        label: "x",
        parameters: undefined as never,
      }),
    ).rejects.toBeDefined();
  });
  it("uses secure random values for the public export path", async () => {
    await expect(
      exportPrivateKey({
        privateKey,
        password: "secret",
        label: "x",
        parameters: recommendedParameters(),
      }),
    ).resolves.toBeTypeOf("string");
  });
  it("makes encrypted-state and plaintext exports equivalent", async () => {
    const parameters = {
      ...recommendedParameters(),
      keyDerivation: {
        ...recommendedParameters().keyDerivation,
        iterations: 1000,
      },
    };
    const json = await exportPrivateKeyWithRandom(
      { privateKey, password: "päss🔑", label: "Personal key", parameters },
      salt,
      iv,
    );
    const document = parseDocument(json);
    const stateJson = exportEncryptedState({
      label: document.label,
      publicKeyHex: document.publicKeyHex,
      keyDerivation: { ...parameters.keyDerivation, salt },
      cipher: {
        ...parameters.cipher,
        iv,
        ciphertextAndTag: decodeBase64Url(
          document.cipher.ciphertextAndTagB64Url,
        ),
      },
    });
    expect(stateJson).toBe(json);
  });
});
