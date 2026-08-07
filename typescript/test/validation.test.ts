import { describe, expect, it } from "vitest";
import { parseDocument } from "../src/validation.js";
import { fixture } from "./helpers.js";
describe("validation", () => {
  it("rejects old protector documents and malformed input", () => {
    expect(() =>
      parseDocument(
        '{"format":"keymaster","version":2,"label":"x","publicKeyHex":"0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798","protectors":[]}',
      ),
    ).toThrow();
    expect(() =>
      parseDocument('{"format":"keymaster","format":"keymaster"}'),
    ).toThrowError(expect.objectContaining({ code: "invalid_json" }));
  });
  it("accepts and rejects the current shared fixtures", () => {
    expect(() => parseDocument(fixture("valid/basic.json"))).not.toThrow();
    expect(() =>
      parseDocument(fixture("invalid/unknown-field.json")),
    ).toThrowError(expect.objectContaining({ code: "invalid_document" }));
  });
  it("accepts UTF-8 bytes and rejects invalid UTF-8", () => {
    const json = fixture("valid/basic.json");
    expect(parseDocument(new TextEncoder().encode(json)).label).toBe(
      "Personal key",
    );
    expect(() => parseDocument(Uint8Array.from([0xff, 0xfe]))).toThrowError(
      expect.objectContaining({ code: "invalid_json" }),
    );
  });
});
