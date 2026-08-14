---
id: errors
title: Errors
sidebar_label: Errors
---

# Errors

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Treat error codes as the stable contract. Human-readable messages can add context and may change; the code identifies the class of failure.

<Tabs groupId="sdk" queryString="sdk">
<TabItem value="typescript" label="TypeScript">

```ts
try {
  const document = parseDocument(value);
} catch (error) {
  if (isKeyHoldError(error) && error.code === 'invalid_document') {
    // Ask for a fresh document.
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
        // Ask for a fresh document.
    }
}
```

</TabItem>
</Tabs>

The stable categories are `invalid_json`, `unsupported_format`, `unsupported_version`, `invalid_document`, `unsupported_algorithm`, `invalid_parameter`, `invalid_private_key`, and `unlock_failed`.
