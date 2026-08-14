---
id: getting-started
title: 快速开始
sidebar_label: 快速开始
---

# 快速开始

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

KeyHold 是一个边界清晰的小型协议：使用密码加密一个 secp256k1 私钥，生成可携带的 JSON 文档。请选择与你的应用匹配的 SDK。

## 安装

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

## 第一个操作

TypeScript SDK 对密码学操作返回 Promise；Go SDK 显式返回 `error`。两者生成同一种文档格式。

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

接着可以用 [SDK 功能总览](/operations) 选择能力，或阅读[导出与解锁](./export-unlock)。
