# Document format

KeyHold v2 is intentionally small:

~~~json
{
  "format": "keymaster",
  "version": 2,
  "label": "Personal key",
  "publicKeyHex": "compressed secp256k1 public key",
  "keyDerivation": {
    "algorithm": "pbkdf2-hmac-sha-256",
    "passwordEncoding": "utf-8",
    "iterations": 600000,
    "outputLengthBits": 256,
    "saltB64Url": "16-byte salt"
  },
  "cipher": {
    "algorithm": "aes-gcm",
    "keyLengthBits": 256,
    "ivB64Url": "12-byte IV",
    "tagLengthBits": 128,
    "ciphertextAndTagB64Url": "32-byte ciphertext + 16-byte tag"
  }
}
~~~

The discriminator remains \`format: "keymaster"\` for the KeyHold v2 document
format. \`version: 2\` is required. All fields are explicit; unknown fields and
duplicate JSON keys are rejected.

## What is stored

- \`label\` is human-readable metadata.
- \`publicKeyHex\` is the compressed public key derived from the private key.
- \`keyDerivation\` records the exact PBKDF2 parameters and salt.
- \`cipher\` records the exact AES-GCM parameters, IV, and authenticated bytes.

The private key itself is never a document field. It exists only as encrypted
ciphertext and as the result of a successful unlock.

## Canonical bytes

Raw salt, IV, ciphertext, and tag are encoded as canonical base64url without
padding. The SDK owns encoding and decoding so TypeScript and Go produce the
same JSON shape.
