# Errors

Public operations use one stable error type. Branch on \`code\`, not on the
English diagnostic message.

~~~ts
import { isKeyHoldError, unlock } from "keyhold";

try {
  await unlock(document, password);
} catch (error) {
  if (isKeyHoldError(error)) {
    console.log(error.code, error.message);
  }
}
~~~

## Error codes

| Code | Meaning |
| --- | --- |
| \`invalid_json\` | The input is not accepted as JSON under KeyHold's strict parser. |
| \`unsupported_format\` | The document discriminator is not \`keymaster\`. |
| \`unsupported_version\` | The document version is not \`2\`. |
| \`invalid_document\` | A required field, type, encoding, or byte length is invalid. |
| \`unsupported_algorithm\` | A KDF or cipher algorithm is not part of KeyHold v2. |
| \`invalid_parameter\` | Export parameters or input values are invalid. |
| \`invalid_private_key\` | The private key is not a valid 32-byte secp256k1 key. |
| \`unlock_failed\` | Authentication, decryption, private-key validation, or public-key matching failed. |

\`unlock_failed\` intentionally groups wrong passwords, damaged ciphertext, and
public-key mismatch. Callers should not use error messages to infer which
condition occurred.

## Go errors

The Go SDK exposes the same categories through \`KeyHoldError\`,
\`ErrorCodeOf\`, and sentinel constants such as \`ErrInvalidDocument\` and
\`ErrUnlockFailed\`.

~~~go
if errors.Is(err, keyhold.ErrUnlockFailed) {
    // Treat the document/password pair as unavailable.
}
~~~
