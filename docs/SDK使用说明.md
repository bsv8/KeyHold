# KeyHold SDK 使用说明

KeyHold v2 是一个 JSON 文件、一个密码和一把 secp256k1 私钥。所有示例材料都是公开测试数据，不得用于生产备份。

格式没有默认参数。调用方必须显式取得或构造参数；SDK 不会因为参数缺失而静默采用推荐值。SDK 当前推荐 PBKDF2 iterations 为 `600000`。

## TypeScript

```ts
import {
  exportPrivateKey,
  recommendedParameters,
  parse,
  unlock,
  serialize,
} from '@bsv8/keyhold'

const privateKey = new Uint8Array(32)
privateKey[31] = 1 // 仅测试
const parameters = recommendedParameters()

const json = await exportPrivateKey({
  privateKey,
  password: 'test password',
  label: 'Personal key',
  parameters,
})

const document = parse(json)
const result = await unlock(document, 'test password')
const sameDocument = serialize(document)
```

`exportPrivateKey` 会验证私钥，派生 compressed public key，生成 16-byte salt 和 12-byte IV，执行 PBKDF2-HMAC-SHA-256 与 AES-256-GCM，并返回完整 JSON。密码按原始 Unicode scalar sequence 编码为 UTF-8，不 trim、不 normalization。

已有存储状态且已确认完全遵循 KeyHold 语义时，可以直接组装：

```ts
import { exportEncryptedState } from '@bsv8/keyhold'

const json = exportEncryptedState({
  label: 'Personal key',
  publicKeyHex,
  keyDerivation: {
    ...parameters.keyDerivation,
    salt: storedSaltBytes,
  },
  cipher: {
    ...parameters.cipher,
    iv: storedIvBytes,
    ciphertextAndTag: storedCiphertextAndTagBytes,
  },
})
```

此入口不接收密码或私钥，不执行 KDF、解密、重新加密或随机生成；raw bytes 由 SDK 编码为 canonical base64url。若来源密文使用了 AAD、不同 plaintext、不同 tag 布局或不同 KDF，必须先在采用方安全边界内解密，再调用 `exportPrivateKey`。

## Go

```go
import keyhold "github.com/bsv8/KeyHold/go/v2"

parameters := keyhold.RecommendedParameters()

jsonBytes, err := keyhold.ExportPrivateKey(keyhold.PrivateKeyExportInput{
    PrivateKey: privateKey, // 公开测试私钥
    Password:   "test password",
    Label:      "Personal key",
    Parameters: parameters,
})
if err != nil { /* 处理错误 */ }

document, err := keyhold.Parse(jsonBytes)
result, err := keyhold.Unlock(document, "test password")
sameDocument, err := keyhold.Serialize(document)
```

加密状态导出使用 raw bytes：

```go
jsonBytes, err := keyhold.ExportEncryptedState(keyhold.EncryptedStateInput{
    Label:        "Personal key",
    PublicKeyHex: publicKeyHex,
    KeyDerivation: keyhold.EncryptedKDFInput{
        Algorithm: "pbkdf2-hmac-sha-256", PasswordEncoding: "utf-8",
        Iterations: storedIterations, OutputLengthBits: 256, Salt: storedSalt,
    },
    Cipher: keyhold.EncryptedCipherInput{
        Algorithm: "aes-gcm", KeyLengthBits: 256, TagLengthBits: 128,
        IV: storedIV, CiphertextAndTag: storedCiphertextAndTag,
    },
})
```

两种导出入口使用同一个 Document builder；给定相同私钥、密码、label、参数、salt 和 IV 时，会产生相同文档。Go 的 `exportPrivateKeyWithRandom` 仅供包内测试固定随机值使用，不属于公共 API。

## 导入、解锁与密码更换

- `parse`/`Parse` 只验证 JSON 结构和公开字段，不索要密码，不尝试解密。
- `unlock`/`Unlock` 使用文档中实际写明的 salt、iterations、IV 和 cipher 参数，不用推荐参数替换它们。
- 解锁成功必须同时满足 GCM 认证、合法私钥和 public key 匹配；错误密码、密文损坏、非法明文和公钥不匹配统一返回 `unlock_failed`。
- `serialize`/`Serialize` 不解密、不重新加密、不刷新随机值。
- 更换密码必须先解锁，再用显式参数调用明文私钥导出；调用方负责原子替换旧文件。

SDK 不提供 WebAuthn、Passkey、protector 数组、多密码尝试、多私钥、文件 IO、数据库 API、地址、WIF 或历史格式迁移。
