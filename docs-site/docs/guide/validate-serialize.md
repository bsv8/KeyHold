---
id: validate-serialize
title: Validate and serialize
sidebar_label: Validate & serialize
---

# Validate and serialize

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Validation is strict: unknown fields, duplicate JSON keys, non-canonical encodings, unsupported versions, and mismatched public keys are rejected. Serialization emits one canonical JSON representation.

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
const document = validateDocument(input);
const canonical = serializeDocument(document);
```

TypeScript accepts `unknown` at the boundary and returns a normalized `Document`.

</TabItem>
<TabItem value="go" label="Go">

```go
if err := keyhold.Validate(document); err != nil { return err }
canonical, err := keyhold.Serialize(document)
```

Go validates an already-decoded `Document` and reports failure through `error`.

</TabItem>
</Tabs>

See [Document format](../concepts/document-format) for the fields and invariants shared by both SDKs.
