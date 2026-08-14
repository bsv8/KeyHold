# KeyHold

KeyHold 定义并实现一种极简的密码私钥备份格式：

> 一个 JSON 文件、一个密码、一把 secp256k1 私钥。

格式 discriminator 固定为：

```json
{
  "format": "keymaster",
  "version": 2
}
```

KeyHold 提供语义一致的 TypeScript SDK 与 Go SDK。采用方通过 SDK 创建、解析、序列化和解锁文件，不复制格式判断、编码或密码学实现。

SDK 提供两种等价导出入口：

- 加密状态导出：存储已经符合 KeyHold 加密语义时，不解密、不重新加密，只把显式参数和密文字节组装为 Document。
- 私钥导出：调用方提交明文私钥、密码、label 和显式参数，由 SDK 生成随机值、加密并输出完整 Document。

格式没有默认参数。SDK 可以提供推荐参数对象，但调用方必须明确选择或传入自己的合法参数；最终使用的每个参数都会完整写进 JSON。

KeyHold 不包含 WebAuthn、Passkey、protector 数组、Vault verifier、metadata 或历史兼容逻辑。采用方的密文存储模型应靠向 KeyHold；加密状态导出只序列化当前 KeyHold Document，不解密或重新加密。

## 文档

- [设计原则](docs/设计原则.md)
- [需求规格](docs/需求规格.md)
- [SDK 使用说明](docs/SDK使用说明.md)
- [API Reference](docs/api/README.md)
- [一次性硬切换施工单](施工单/2026-08-07-001-KeyHold-TypeScript-Go-SDK-硬切换.md)

文档站源码位于 [docs-site/](docs-site/)，复用 Keymaster Connect 文档站的主题，
并从 TypeScript SDK 入口自动生成 API Reference：

~~~sh
make docs-site
~~~

当前实现已按单密码模型完成硬切换；旧的多-protector/WebAuthn 草稿不属于可发布 API。
