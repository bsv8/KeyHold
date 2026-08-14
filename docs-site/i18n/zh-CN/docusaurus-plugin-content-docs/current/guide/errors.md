---
id: errors
title: 错误处理
sidebar_label: 错误处理
---

# 错误处理

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

将错误码视为稳定契约。可读消息可以提供上下文，也可能变化；错误码负责识别失败类别。

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
try {
  const document = parseDocument(value);
} catch (error) {
  if (isKeyHoldError(error) && error.code === 'invalid_document') {
    // 请求一份新文档。
  }
}
```

</TabItem>
<TabItem value="go" label="Go">

```go
document, err := keyhold.Parse(data)
if err != nil {
    switch keyhold.ErrorCodeOf(err) {
    case keyhold.ErrInvalidDocument:
        // 请求一份新文档。
    }
}
```

</TabItem>
</Tabs>

稳定类别包括 `invalid_json`、`unsupported_format`、`unsupported_version`、`invalid_document`、`unsupported_algorithm`、`invalid_parameter`、`invalid_private_key` 和 `unlock_failed`。
