---
id: interoperability
title: 互操作性
sidebar_label: 互操作性
---

# 互操作性

TypeScript 与 Go SDK 是同一线格式的两种视图。一个 SDK 导出的文档可以由另一个 SDK 解析、验证并解锁，只要提供相同密码。

跨语言测试应聚焦协议边界：一个 SDK 导出，另一个解析并验证，随后解锁并比较恢复出的公钥，最后在需要时比较规范 JSON。

[SDK 功能总览](/operations) 展示了调用契约差异：TypeScript 在验证边界使用 `Promise` 和 `unknown`，Go 使用 `error` 和已经解码的 `Document`。
