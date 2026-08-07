# @bsv8/keyhold

TypeScript SDK for the KeyHold keymaster v2 format.

```ts
import { exportPrivateKey, recommendedParameters, parse, unlock } from "@bsv8/keyhold";

const json = await exportPrivateKey({
  privateKey,
  password: "test password",
  label: "Personal key",
  parameters: recommendedParameters(),
});
const result = await unlock(parse(json), "test password");
```

The package implements one JSON document, one password, and one secp256k1 private key. See the repository documentation for the complete format and security rules.
