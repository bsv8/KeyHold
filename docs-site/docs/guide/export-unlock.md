---
id: export-unlock
title: Export and unlock
sidebar_label: Export & unlock
---

# Export and unlock

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Export creates the complete document. Unlock is the only operation that returns secret key material, and it verifies the recovered private key against the stored public key before returning.

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
const encoded = await exportPrivateKey(input);
const document = parseDocument(encoded);
const result = await unlockDocument(document, password);
// result.privateKey is a Uint8Array; keep it in memory only as long as needed.
```

</TabItem>
<TabItem value="go" label="Go">

```go
encoded, err := keyhold.ExportPrivateKey(input)
if err != nil { return err }
document, err := keyhold.Parse(encoded)
if err != nil { return err }
result, err := keyhold.Unlock(document, password)
if err != nil { return err }
// result.PrivateKey is []byte; keep it in memory only as long as needed.
```

</TabItem>
</Tabs>

`exportEncryptedState` is for callers that already hold the encrypted bytes and need canonical document serialization. It never needs the password or plaintext private key.
