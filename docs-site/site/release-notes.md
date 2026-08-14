# Release notes

## 2.0.0

KeyHold v2 is the current hard-cut format:

- one JSON document, one password, and one secp256k1 private key;
- explicit PBKDF2-HMAC-SHA-256 and AES-256-GCM parameters;
- TypeScript and Go SDKs with matching validation and error categories;
- private-key export and already-encrypted-state export;
- strict parsing, canonical serialization, authenticated unlock, and public-key matching;
- no file I/O, database API, address derivation, WIF, WebAuthn, or legacy migration.
