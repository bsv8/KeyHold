# Export and unlock

KeyHold has two export paths. Pick the path that matches where the plaintext
private key exists.

## Export a private key

Use \`exportPrivateKey\` when the adopting application already has a plaintext
32-byte private key and needs the SDK to create a new document.

~~~ts
const json = await exportPrivateKey({
  privateKey,
  password,
  label,
  parameters: {
    keyDerivation: {
      algorithm: "pbkdf2-hmac-sha-256",
      passwordEncoding: "utf-8",
      iterations: 600_000,
      outputLengthBits: 256
    },
    cipher: {
      algorithm: "aes-gcm",
      keyLengthBits: 256,
      tagLengthBits: 128
    }
  }
});
~~~

There are no implicit format defaults. \`recommendedParameters()\` is an
explicit convenience object; the selected parameters are written into the
document and used by unlock later.

## Serialize an already-encrypted state

If an application already has bytes that are known to follow the exact KeyHold
semantics, \`exportEncryptedState\` can assemble the document without
decrypting or re-encrypting it.

~~~ts
const json = exportEncryptedState({
  label,
  publicKeyHex,
  keyDerivation: {
    ...parameters.keyDerivation,
    salt: storedSalt
  },
  cipher: {
    ...parameters.cipher,
    iv: storedIv,
    ciphertextAndTag: storedCiphertextAndTag
  }
});
~~~

This path does not accept a password or private key, and it does not generate
random values. If the source used different plaintext, AAD, tag layout, or KDF
semantics, decrypt it inside the adopting application's security boundary and
call \`exportPrivateKey\` instead.

## Unlock

~~~ts
const document = parse(json);
const { privateKey, publicKeyHex } = await unlock(document, password);
~~~

\`unlock\` reads the salt, iteration count, IV, and algorithms from the document.
It never replaces them with the current recommended parameters. Wrong
passwords, damaged ciphertext, invalid private keys, and public-key mismatch
all fail with the stable \`unlock_failed\` code.

## Change a password

Unlock the document, then export the returned private key with the new password
and an explicit parameter set. Replace the old stored document atomically.
