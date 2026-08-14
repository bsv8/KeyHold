# Security model

KeyHold is a format and SDK boundary, not a vault service. It protects the
private key while it is represented as a document; the adopting application is
responsible for passwords, storage, access control, and recovery.

## Explicit cryptographic state

Every KDF and cipher parameter used by a document is stored in that document.
Unlock uses those values rather than silently applying current recommendations.
This makes cross-language recovery predictable and prevents a parameter change
from changing the meaning of an existing backup.

## Authenticated unlock

AES-GCM authentication is checked before the plaintext is accepted. The SDK then
derives the public key again and compares it to the stored public key. A caller
gets the same \`unlock_failed\` category for wrong passwords, tampering, invalid
plaintext, and mismatch.

## Application responsibilities

- Keep the password out of logs, analytics, URLs, and crash reports.
- Treat the private key returned by \`unlock\` as sensitive memory.
- Replace documents atomically when changing a password.
- Use \`exportEncryptedState\` only for bytes already proven to match KeyHold.
- Decide how documents are stored, backed up, deleted, and recovered.
