# Getting started

KeyHold is a small JSON document format: one secp256k1 private key encrypted
with one password. The TypeScript and Go SDKs own the format rules, encoding,
cryptography, and public-key verification.

## Install

~~~bash
npm install keyhold
~~~

The package does not read files, write databases, or choose a storage policy.
Those boundaries stay with the application that adopts the format.

## Export a document

~~~ts
import { exportPrivateKey, recommendedParameters } from "keyhold";

const privateKey = new Uint8Array(32);
privateKey[31] = 1; // public test key only

const json = await exportPrivateKey({
  privateKey,
  password: "correct horse battery staple",
  label: "Personal key",
  parameters: recommendedParameters()
});
~~~

\`exportPrivateKey\` derives the compressed public key, generates a 16-byte salt
and 12-byte IV, derives an AES-256 key with PBKDF2-HMAC-SHA-256, and returns a
complete canonical JSON document.

## Parse and unlock

~~~ts
import { parse, serialize, unlock } from "keyhold";

const document = parse(json); // structure only; no password is needed
const result = await unlock(document, "correct horse battery staple");

console.log(result.publicKeyHex);
const canonicalJson = serialize(document);
~~~

Successful unlock includes authenticated decryption and a check that the
recovered private key derives the document's \`publicKeyHex\`.

## Go

~~~go
import keyhold "github.com/bsv8/KeyHold/go/v2"

parameters := keyhold.RecommendedParameters()
jsonBytes, err := keyhold.ExportPrivateKey(keyhold.PrivateKeyExportInput{
    PrivateKey: privateKey,
    Password:   "correct horse battery staple",
    Label:      "Personal key",
    Parameters: parameters,
})
~~~

The Go SDK exposes the same document model and error categories. See the
[export and unlock guide](/guide/export-unlock) for the complete flow.

## Next

- Read the [document format](/concepts/document-format).
- Learn about [password and cipher parameters](/concepts/password-crypto).
- Browse the generated [TypeScript API](/api/).
