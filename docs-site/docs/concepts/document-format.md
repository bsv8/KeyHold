---
id: document-format
title: Document format
sidebar_label: Document format
---

# Document format

KeyHold v2 is a strict JSON object with six top-level fields:

| Field | Meaning |
| --- | --- |
| `format` | Always `keymaster` for this format. |
| `version` | The supported document version, currently `2`. |
| `label` | A human-readable, non-empty label. |
| `publicKeyHex` | A compressed secp256k1 public key in lowercase hex. |
| `keyDerivation` | PBKDF2-HMAC-SHA-256 parameters and salt. |
| `cipher` | AES-GCM parameters, IV, and ciphertext with tag. |

The private key never appears as a JSON field. It is recovered only after password-based decryption and public-key matching.

Both SDKs reject extra fields and non-canonical base64url/hex values. Read the generated [TypeScript API](/api/typescript) or [Go API](/api/go) for exact signatures.
