---
id: document-format
title: 文档格式
sidebar_label: 文档格式
---

# 文档格式

KeyHold v2 是一个包含六个顶层字段的严格 JSON 对象：

| 字段 | 含义 |
| --- | --- |
| `format` | 此格式固定为 `keymaster`。 |
| `version` | 当前支持的文档版本为 `2`。 |
| `label` | 非空的人类可读标签。 |
| `publicKeyHex` | 小写十六进制的压缩 secp256k1 公钥。 |
| `keyDerivation` | PBKDF2-HMAC-SHA-256 参数和盐。 |
| `cipher` | AES-GCM 参数、IV 及带标签的密文。 |

私钥不会出现在 JSON 字段中；只有密码解密并完成公钥匹配后才会恢复。

两套 SDK 都会拒绝额外字段和非规范 base64url/hex 值。精确签名请查看生成的 [TypeScript API](/api/typescript) 或 [Go API](/api/go)。
