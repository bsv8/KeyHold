# Interoperability

TypeScript and Go implement the same KeyHold v2 contract. A document exported
by one SDK can be parsed, serialized, and unlocked by the other when given the
same password.

## Shared contract

- JSON field names and ordering are canonical.
- Password encoding is UTF-8.
- KDF is PBKDF2-HMAC-SHA-256.
- Cipher is AES-256-GCM with a 128-bit tag.
- Public keys are compressed secp256k1 keys encoded as lowercase hex.
- Binary fields use unpadded base64url.
- Error categories are stable across languages.

## Storage stays outside the SDK

The SDK accepts and returns strings or byte arrays. It does not open files,
write databases, derive addresses, encode WIF, or migrate legacy formats. An
adopting application can choose its own backup, replacement, and recovery
policy without changing the KeyHold document contract.

For already-encrypted storage, use \`exportEncryptedState\` only after the
application has verified that its existing bytes have exactly KeyHold semantics.
