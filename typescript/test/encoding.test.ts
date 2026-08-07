import { describe, expect, it } from "vitest";
import {
  decodeBase64Url,
  decodeHex,
  encodeBase64Url,
  encodeHex,
} from "../src/encoding.js";
describe("strict encoding", () => {
  it("round trips canonical bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect(encodeBase64Url(bytes)).toBe("AAEC-v8");
    expect(decodeBase64Url("AAEC-v8")).toEqual(bytes);
    expect(encodeHex(bytes)).toBe("000102faff");
    expect(decodeHex("000102faff")).toEqual(bytes);
  });
  it("rejects padding and non-canonical JSON numbers/keys", () => {
    expect(() => decodeBase64Url("AA==")).toThrow();
    expect(() => decodeHex("0A")).toThrow();
  });
});
