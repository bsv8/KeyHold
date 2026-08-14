---
id: export-unlock
title: 导出与解锁
sidebar_label: 导出与解锁
---

# 导出与解锁

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

导出会创建完整文档。解锁是唯一返回私钥材料的操作；返回前它会用存储的公钥验证恢复出的私钥。

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
const encoded = await exportPrivateKey(input);
const document = parseDocument(encoded);
const result = await unlockDocument(document, password);
// result.privateKey 是 Uint8Array；只在需要时保留于内存。
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
// result.PrivateKey 是 []byte；只在需要时保留于内存。
```

</TabItem>
</Tabs>

如果调用方已经拥有加密字节并只需要规范化序列化，可以使用 `exportEncryptedState`。它不需要密码或明文私钥。
