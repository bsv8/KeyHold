# Password and crypto

KeyHold uses one password to derive one AES-256-GCM key.

## Derivation

The password is encoded as UTF-8 without trimming or normalization. PBKDF2 uses
HMAC-SHA-256, an output length of 256 bits, and the document's explicit
iteration count. New exports can use the SDK recommendation of \`600000\`
iterations, but the format has no implicit default.

## Encryption

The 32-byte private key is encrypted with AES-GCM using a 256-bit key, a random
12-byte IV, and a 128-bit authentication tag. KeyHold stores the ciphertext and
tag together as \`ciphertextAndTagB64Url\`.

## Verification

Unlock succeeds only when all of these checks pass:

1. PBKDF2 derives a key from the supplied password.
2. AES-GCM authenticates and decrypts the ciphertext.
3. The plaintext is a valid secp256k1 private key.
4. Its compressed public key matches \`publicKeyHex\`.

The SDK does not expose intermediate cryptographic state and does not support
alternate AAD, tag layouts, or historical formats.
