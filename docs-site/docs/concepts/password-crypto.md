---
id: password-crypto
title: Password & crypto
sidebar_label: Password & crypto
---

# Password & crypto

KeyHold derives a 256-bit key from the UTF-8 password with PBKDF2-HMAC-SHA-256, using a 16-byte random salt and the recommended 600,000 iterations. AES-256-GCM encrypts the 32-byte secp256k1 private key with a random 12-byte IV and a 128-bit authentication tag.

The parameters are explicit in the document so another implementation can reproduce the derivation and verify the ciphertext. The SDK still validates every parameter against the supported algorithm and size constraints.

Password handling is application responsibility: use a secure input path, avoid logs, and discard plaintext key material as soon as the workflow permits.
