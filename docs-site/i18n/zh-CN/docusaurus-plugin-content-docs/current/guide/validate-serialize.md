---
id: validate-serialize
title: 验证与序列化
sidebar_label: 验证与序列化
---

# 验证与序列化

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

验证是严格的：未知字段、重复 JSON 键、非规范编码、不支持的版本和不匹配的公钥都会被拒绝。序列化会输出唯一的规范 JSON 表示。

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
const document = validateDocument(input);
const canonical = serializeDocument(document);
```

TypeScript 在边界接受 `unknown`，并返回规范化后的 `Document`。

</TabItem>
<TabItem value="go" label="Go">

```go
if err := keyhold.Validate(document); err != nil { return err }
canonical, err := keyhold.Serialize(document)
```

Go 验证已经解码的 `Document`，通过 `error` 报告失败。

</TabItem>
</Tabs>

共享字段和不变量请参阅[文档格式](/concepts/document-format)。
