import { describe, expect, it } from "vitest";
import { fixture, jsonFixture, schemaFixture } from "./helpers.js";
import { parseDocument } from "../src/validation.js";
import { unlockDocument } from "../src/document.js";
import {
  decodeBase64Url,
  encodeBase64Url,
  decodeHex,
} from "../src/encoding.js";
import { derivePassword } from "../src/password.js";
import {
  exportEncryptedState,
  exportPrivateKeyWithRandom,
  recommendedParameters,
} from "../src/export.js";

type Manifest = {
  vectors: { id: string; file: string }[];
  valid: { file: string }[];
  invalid: { file: string; parse: string; errorCode?: string }[];
};
describe("shared conformance fixtures", () => {
  const manifest = jsonFixture<Manifest>("manifest.json");
  it("loads the shared JSON Schema", () => {
    const schema = jsonFixture<{ $schema: string; required: string[] }>(
      "../schema/keymaster-v2.schema.json",
    );
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.required).toEqual([
      "format",
      "version",
      "label",
      "publicKeyHex",
      "keyDerivation",
      "cipher",
    ]);
    expect(schemaFixture()).toContain('"keymaster"');
  });
  for (const item of manifest.vectors)
    it(`consumes ${item.file}`, async () => {
      const vector = jsonFixture<{
        privateKeyHex?: string;
        password: string;
        passwordNfcEquivalent?: string;
        saltB64Url: string;
        iterations: number;
        derivedKeyB64Url?: string;
        ivB64Url?: string;
        ciphertextAndTagB64Url?: string;
        label?: string;
      }>(item.file);
      const parameters = {
        ...recommendedParameters(),
        keyDerivation: {
          ...recommendedParameters().keyDerivation,
          iterations: vector.iterations,
        },
      };
      const derived = await derivePassword(
        vector.password,
        decodeBase64Url(vector.saltB64Url),
        parameters.keyDerivation,
      );
      if (vector.derivedKeyB64Url)
        expect(encodeBase64Url(derived)).toBe(vector.derivedKeyB64Url);
      if (vector.passwordNfcEquivalent)
        expect(
          encodeBase64Url(
            await derivePassword(
              vector.passwordNfcEquivalent,
              decodeBase64Url(vector.saltB64Url),
              parameters.keyDerivation,
            ),
          ),
        ).not.toBe(encodeBase64Url(derived));
      if (item.id === "password") {
        const result = await unlockDocument(
          parseDocument(fixture("valid/basic.json")),
          vector.password,
        );
        expect(result.privateKey).toEqual(decodeHex(vector.privateKeyHex));
      }
      if (item.id === "export-equivalence") {
        const salt = decodeBase64Url(vector.saltB64Url);
        const iv = decodeBase64Url(vector.ivB64Url!);
        const privateKey = decodeHex(vector.privateKeyHex!);
        const json = await exportPrivateKeyWithRandom(
          {
            privateKey,
            password: vector.password,
            label: vector.label!,
            parameters,
          },
          salt,
          iv,
        );
        expect(json).toBe(fixture("valid/basic.json").trim());
        const document = parseDocument(json);
        expect(await unlockDocument(document, vector.password)).toMatchObject({
          publicKeyHex: document.publicKeyHex,
        });
        expect(
          exportEncryptedState({
            label: document.label,
            publicKeyHex: document.publicKeyHex,
            keyDerivation: { ...parameters.keyDerivation, salt },
            cipher: {
              ...parameters.cipher,
              iv,
              ciphertextAndTag: decodeBase64Url(vector.ciphertextAndTagB64Url!),
            },
          }),
        ).toBe(json);
      }
    });
  for (const item of manifest.valid)
    it(`accepts ${item.file}`, () =>
      expect(() => parseDocument(fixture(item.file))).not.toThrow());
  for (const item of manifest.invalid)
    it(`handles ${item.file}`, async () => {
      if (item.parse === "success")
        await expect(
          unlockDocument(parseDocument(fixture(item.file)), "päss🔑"),
        ).rejects.toMatchObject({ code: "unlock_failed" });
      else
        expect(() => parseDocument(fixture(item.file))).toThrowError(
          expect.objectContaining({ code: item.errorCode }),
        );
    });
});
