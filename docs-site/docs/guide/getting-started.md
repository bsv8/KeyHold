---
id: getting-started
title: Getting started
sidebar_label: Getting started
---

# Getting started

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

KeyHold is a small protocol with a deliberate boundary: a password encrypts one secp256k1 private key, and the result is a portable JSON document. Start with the SDK that matches your application.

## Install

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```bash
npm install keyhold
```

</TabItem>
<TabItem value="go" label="Go">

```bash
go get github.com/bsv8/KeyHold/go/v2
```

</TabItem>
</Tabs>

## First operation

The TypeScript SDK returns a promise for cryptographic work. The Go SDK returns an explicit `error`; both produce the same document format.

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
import {exportPrivateKey, recommendedParameters} from 'keyhold';

const document = await exportPrivateKey({
  privateKey,
  password: 'correct horse battery staple',
  label: 'primary signing key',
  parameters: recommendedParameters(),
});
```

</TabItem>
<TabItem value="go" label="Go">

```go
parameters := keyhold.RecommendedParameters()
document, err := keyhold.ExportPrivateKey(keyhold.PrivateKeyExportInput{
    PrivateKey: privateKey,
    Password: "correct horse battery staple",
    Label: "primary signing key",
    Parameters: parameters,
})
if err != nil { return err }
```

</TabItem>
</Tabs>

Next, use the [operation map](/operations) to choose a capability, or follow the [export and unlock workflow](./export-unlock).
