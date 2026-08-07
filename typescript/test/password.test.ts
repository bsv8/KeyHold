import { describe, expect, it } from "vitest";
import { decodeBase64Url, encodeBase64Url } from "../src/encoding.js";
import { derivePassword } from "../src/password.js";
import { jsonFixture } from "./helpers.js";

describe("shared password vectors", () => {
  it("matches PBKDF2-HMAC-SHA-256 and preserves Unicode code points", async () => {
    const vector = jsonFixture<{
      password: string;
      passwordNfcEquivalent: string;
      saltB64Url: string;
      iterations: number;
      derivedKeyB64Url: string;
    }>("vectors/unicode-password.json");
    const parameters = {
      algorithm: "pbkdf2-hmac-sha-256" as const,
      passwordEncoding: "utf-8" as const,
      iterations: vector.iterations,
      outputLengthBits: 256 as const,
    };
    const key = await derivePassword(
      vector.password,
      decodeBase64Url(vector.saltB64Url),
      parameters,
    );
    const other = await derivePassword(
      vector.passwordNfcEquivalent,
      decodeBase64Url(vector.saltB64Url),
      parameters,
    );
    expect(encodeBase64Url(key)).toBe(vector.derivedKeyB64Url);
    expect(encodeBase64Url(other)).not.toBe(vector.derivedKeyB64Url);
  });
});
