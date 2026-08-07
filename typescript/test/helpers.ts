import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export function fixture(path: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../fixtures/${path}`, import.meta.url)),
    "utf8",
  );
}
export function jsonFixture<T>(path: string): T {
  return JSON.parse(fixture(path)) as T;
}
