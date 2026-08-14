# Validate and serialize

Parsing and serialization are deliberately separate from decryption. This
makes it possible to inspect public metadata without asking for a password.

## Parse JSON

~~~ts
const document = parse(jsonText);
~~~

\`parse\` rejects invalid JSON, duplicate object keys, unknown fields, invalid
base64url, unsupported format/version values, and malformed cryptographic
parameters. It returns a validated \`Document\`; it never unlocks it.

## Validate an in-memory value

~~~ts
const document = validateDocument(value);
~~~

Use \`validate\` as the short alias. Validation returns normalized values, so the
result is safe to pass to other SDK operations.

## Canonical serialization

~~~ts
const jsonText = serialize(document);
~~~

\`serialize\` validates before emitting JSON and does not decrypt, re-encrypt,
refresh salt, or refresh IV. A document can therefore be parsed and serialized
without access to the password.

## Public summary

~~~ts
const metadata = summary(document);
~~~

The summary contains only \`format\`, \`version\`, \`label\`, and
\`publicKeyHex\`. It does not expose the password-derived key or decrypted
private key.
