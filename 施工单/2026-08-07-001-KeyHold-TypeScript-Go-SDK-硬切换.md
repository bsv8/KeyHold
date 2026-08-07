# 施工单：KeyHold 单密码格式与双语言 SDK 一次性硬切换

编号：2026-08-07-001
类型：硬切换 / 单次完整交付
依据：[需求规格](../docs/需求规格.md)
状态：已实施，等待远程 CI 验收

## 1. 交付目标

一次迭代同时交付：

- `format=keymaster, version=2` 的唯一 JSON Schema；
- 单文件、单密码、单私钥格式实现；
- TypeScript SDK；
- Go SDK；
- 两种语言共用的 fixtures 与 conformance tests；
- SDK 使用说明和 CI。

完成前不发布部分实现；完成后第三方只能通过 SDK 创建、解析、序列化和解锁 KeyHold Document。

## 2. 为什么硬切换

- KeyHold 尚未发布 SDK，没有保留旧设计的业务价值。
- WebAuthn credential 受 RP ID 约束，不符合域名无关私钥备份的核心使命。
- 删除 protector 抽象后，数据结构、API、测试和采用方存储模型都可以显著缩小。
- 一次替换 schema、fixtures、两种 SDK 与文档，避免旧的多 protector 模型继续形成事实兼容负担。

这是一项完整交付要求，不是分阶段上线方案。任一语言、schema 或跨语言验收未完成，整个施工单都不得发布。

## 3. 最终目录

```text
KeyHold/
  README.md
  LICENSE
  Makefile
  schema/
    keymaster-v2.schema.json
  fixtures/
    manifest.json
    vectors/
      password.json
      unicode-password.json
      export-equivalence.json
    valid/
      basic.json
      custom-iterations.json
      unicode-label.json
    invalid/
      unsupported-format.json
      unsupported-version.json
      unknown-field.json
      duplicate-field.json
      invalid-public-key.json
      invalid-base64url.json
      invalid-kdf.json
      invalid-cipher.json
      corrupted-ciphertext.json
      corrupted-tag.json
      public-key-mismatch.json
  typescript/
    package.json
    tsconfig.json
    tsconfig.build.json
    vitest.config.ts
    src/
      model.ts
      constants.ts
      errors.ts
      encoding.ts
      validation.ts
      secp256k1.ts
      aesGcm.ts
      password.ts
      document.ts
      export.ts
      index.ts
    test/
      encoding.test.ts
      validation.test.ts
      password.test.ts
      document.test.ts
      export.test.ts
      conformance.test.ts
  go/
    go.mod
    go.sum
    model.go
    constants.go
    errors.go
    encoding.go
    validation.go
    secp256k1.go
    aesgcm.go
    password.go
    document.go
    export.go
    encoding_test.go
    validation_test.go
    password_test.go
    document_test.go
    export_test.go
    conformance_test.go
  docs/
    设计原则.md
    需求规格.md
    SDK使用说明.md
  施工单/
    2026-08-07-001-KeyHold-TypeScript-Go-SDK-硬切换.md
  .github/
    workflows/
      ci.yml
```

允许增加语言 lockfile、构建忽略规则和 license notice；不允许增加第二套 schema、protector 目录、WebAuthn 模块或产品适配代码。

### 3.1 当前旧实现的处理清单

工作区中已经存在一套多-protector 草稿。硬切换不是在其上增加单密码分支，而是按以下文件级范围清理：

必须删除：

- `typescript/src/webauthnPrf.ts`
- `typescript/test/webauthnPrf.test.ts`
- `go/webauthn_prf.go`
- `go/webauthn_prf_test.go`
- `fixtures/vectors/webauthn-prf.json`
- `fixtures/vectors/multiple-passwords.json`
- `fixtures/valid/passkey-only.json`
- `fixtures/valid/mixed-protectors.json`
- `fixtures/valid/multiple-passkeys.json`
- `fixtures/valid/duplicate-labels.json`
- `fixtures/invalid/empty-protectors.json`

必须按新结构完整重写，而不是添加兼容分支：

- `schema/keymaster-v2.schema.json`
- `fixtures/manifest.json`
- `fixtures/vectors/password.json`
- `fixtures/valid/password-only.json`，重写后改名为 `fixtures/valid/basic.json`
- 其余继续使用的 `fixtures/invalid/*.json`
- `typescript/src/model.ts`
- `typescript/src/constants.ts`
- `typescript/src/errors.ts`
- `typescript/src/validation.ts`
- `typescript/src/password.ts`
- `typescript/src/document.ts`
- `typescript/src/index.ts`
- 所有继续保留的 `typescript/test/*.test.ts`
- `go/model.go`
- `go/constants.go`
- `go/errors.go`
- `go/validation.go`
- `go/password.go`
- `go/document.go`
- 所有继续保留的 `go/*_test.go`
- `docs/SDK使用说明.md`

`typescript/dist/` 是旧构建产物，硬切换实现前清理，最终由新源码重新生成；`typescript/node_modules/` 继续作为本地依赖目录忽略，不进入版本库。

### 3.2 当前 Keymaster 加密状态的适配结论

当前 Keymaster Vault 记录不能直接传给 `exportEncryptedState`。只读核对得到以下结论：

- 当前 Vault password key 使用 PBKDF2-HMAC-SHA-256 200,000 iterations。该值低于 KeyHold 当前推荐值但仍可被格式显式表达；导出时绝不能伪写为 600,000。
- 真正的 PBKDF2 salt 是 Vault meta 的 `saltB64`；key record 的 `cipherSaltB64` 没有参与该私钥的 AES-GCM 运算，不能错误映射成 KeyHold `saltB64Url`。
- 当前 Vault v2 私钥密文使用 `keymaster:v2|vault-key|${publicKeyHex}` 作为 AES-GCM AAD；KeyHold 不使用 AAD，这是直接复用的阻断项。
- 当前 Vault 加密的 plaintext 是 `{hex,wif}` JSON bytes；KeyHold plaintext 固定为原始 32-byte private key，这是直接复用的阻断项。

因此，Keymaster 接入时只能选择以下一种做法：

1. 将 Keymaster 新存储硬切换为 KeyHold 密码学语义，之后新记录走加密状态直接导出；或
2. 对现有记录先在 Keymaster 内解密，再调用 KeyHold 的明文私钥导出。

不能为了复用当前 Vault ciphertext 而在 KeyHold 中加入 AAD、JSON plaintext、Vault verifier 或产品专用分支。KeyHold SDK 不承担 Keymaster 数据迁移。

## 4. 文件级施工

### 4.1 根目录

#### `README.md`

- 用“一文件、一密码、一私钥”说明项目。
- 给出最小 JSON 和 TypeScript/Go 使用入口。
- 明确不支持 WebAuthn、多密码、多私钥和历史格式。

#### `Makefile`

- 提供 `test`、`test-ts`、`test-go`、`conformance`、`build-ts`、`fmt-check-go`。
- `test` 一次运行 TypeScript 与 Go 全部测试。
- 不在 Makefile 复制算法参数。

### 4.2 Schema

#### `schema/keymaster-v2.schema.json`

- 使用 JSON Schema 2020-12。
- 顶层只允许六个必填字段：`format`、`version`、`label`、`publicKeyHex`、`keyDerivation`、`cipher`。
- 所有对象使用 `additionalProperties: false`。
- `format` 固定 `keymaster`，`version` 固定整数 `2`。
- label `minLength: 1`，不设置 maxLength。
- 精确表达 PBKDF2 与 AES-GCM 的封闭字段、枚举和整数范围。
- Schema 只负责可表达的结构；canonical base64url、曲线点、重复 JSON 字段和密码学交叉检查由 SDK validator 完成。
- 不定义 `protectors`、`oneOf` 或未来算法占位结构。

### 4.3 Shared fixtures

#### `fixtures/manifest.json`

- 列出每个 fixture 的用途、parse/validate/unlock 预期和稳定错误码。
- 明确所有密码和私钥都是公开测试材料，禁止真实备份进入仓库。

#### `fixtures/vectors/*.json`

- 固定 private key、密码、salt、IV、iterations、派生 AES key、public key、ciphertext 和 tag。
- `password.json` 使用 ASCII 基准向量。
- `unicode-password.json` 验证 UTF-8 原样编码且不做 Unicode normalization。
- `export-equivalence.json` 提供固定 private key、密码、参数、salt、IV 和密文，证明两种导出路径得到相同 Document。
- `ciphertextAndTagB64Url` 的预期值必须是 32-byte ciphertext 后接 16-byte tag。
- 固定随机值只允许通过测试内部 seam 注入，生产 API 不暴露固定 RNG 参数。

#### `fixtures/valid/*.json`

- 覆盖推荐 iterations、其他合法 iterations 和 Unicode label。
- 每个 fixture 只能有一个 keyDerivation 和一个 cipher。

#### `fixtures/invalid/*.json`

- 覆盖未知/重复字段、编码、长度、整数表示、KDF/cipher 参数和 public key 错误。
- 损坏 ciphertext/tag 和 public key mismatch 必须允许 parse，但 unlock 返回 `unlock_failed`。

### 4.4 TypeScript SDK

#### `typescript/package.json`

- 包名 `keyhold`，使用 ESM，不依赖 npm organization scope。
- 导出编译 JS、类型声明和 sourcemap。
- PBKDF2-HMAC-SHA-256、AES-GCM 和随机源使用 WebCrypto；生产依赖只增加受维护的 secp256k1 库。
- 测试使用 Vitest。

#### `typescript/src/model.ts`

- 定义唯一 `Document`、`KeyDerivation`、`Cipher`、`RecommendedParameters`、`EncryptedStateInput`、`PrivateKeyExportInput`、`UnlockResult` 和 `DocumentSummary`。
- JSON 字段与类型字段一一对应。
- 不定义 Protector、PasswordProtector、WebAuthn 或 union。

#### `typescript/src/constants.ts`

- 集中定义 format、version、算法关键字、编码、iterations 合法范围、当前推荐 iterations 和所有 byte/bit 长度。
- validator、crypto 与测试引用同一常量来源，不复制魔法数字。
- 推荐 iterations 不得命名为 default，也不得在调用方省略参数时自动注入。

#### `typescript/src/errors.ts`

- 实现带稳定 `code` 的 `KeyHoldError`。
- 映射需求规格全部错误码。
- message、cause 的公开序列化不得泄露敏感材料。

#### `typescript/src/encoding.ts`

- 严格实现小写 hex 和无 padding canonical base64url。
- base64url 采用验证、解码、重新编码比较流程。
- 在 JSON parser 边界拒绝重复字段、未配对 surrogate 和非十进制整数 literal。
- 不提供宽松、自动猜测或纠错模式。

#### `typescript/src/validation.ts`

- 从 `unknown` 严格验证六个顶层字段及两个嵌套对象。
- 拒绝未知字段、错误枚举、长度、整数和交叉参数。
- 验证 compressed public key 是有效 secp256k1 曲线点。

#### `typescript/src/secp256k1.ts`

- 使用受维护库验证 private/public key 并派生 compressed public key。
- 不自行实现曲线 primitive。

#### `typescript/src/aesGcm.ts`

- 使用 `globalThis.crypto.subtle` 和 `crypto.getRandomValues`。
- 不传 `additionalData`。
- 加密结果作为 `ciphertext || tag` 编码；解密前验证总长度和 tag length。
- 不吞掉 GCM authentication failure。

#### `typescript/src/password.ts`

- 密码 UTF-8 原样编码。
- PBKDF2 的 algorithm、iterations、salt、output length 全部来自 Document 或明文导出参数。
- 参数必须由调用方显式传入；不得存在缺省参数路径。
- `recommendedParameters()` 返回包含 600,000 iterations 的普通参数对象，不产生副作用。

#### `typescript/src/document.ts`

- 实现 parse、validate、serialize、unlock、summary，以及供两个导出入口共用的内部 Document builder。
- unlock 只执行一次 KDF 和一次 AES-GCM 解密。
- serialize 不解密、不重新加密、不更新 salt/IV。

#### `typescript/src/export.ts`

- 实现 `exportEncryptedState` 与 `exportPrivateKey` 两个公开入口。
- `exportEncryptedState` 接收 raw salt、IV、`ciphertext || tag` 和全部显式参数，只验证、编码、组装和序列化。
- `exportPrivateKey` 接收 private key、密码、label 和显式参数，生成 salt/IV、加密并序列化。
- 两个入口共用同一 Document builder、validator 和 serializer，不能维护两套字段拼装逻辑。
- 加密状态入口不接收密码，不调用 PBKDF2/AES-GCM，不生成随机值，也不替换非推荐参数。

#### `typescript/src/index.ts`

- 只导出最小稳定公共 API、两种导出入口、类型、错误和推荐参数函数。
- 不导出内部 RNG seam、低级 crypto helper 或未验证 parser。

#### `typescript/test/*.test.ts`

- 覆盖编码、严格验证、Unicode 密码、创建、解锁、错误密码、密文损坏和序列化。
- `export.test.ts` 覆盖加密状态入口不调用 crypto/随机源、明文入口必须显式传参，以及两条路径的固定向量等价性。
- conformance test 直接读取根目录 shared fixtures，不复制测试向量。

### 4.5 Go SDK

#### `go/go.mod`

- module 使用 `github.com/bsv8/KeyHold/go/v2`，与 v2.0.0 的 Go Semantic Import Versioning 一致。
- PBKDF2 使用 `golang.org/x/crypto/pbkdf2`。
- AES-GCM、SHA-256 和随机源使用 Go 标准库。
- secp256k1 使用受维护依赖并固定版本。

#### `go/model.go`

- 定义与 JSON 一一对应的 Document、KeyDerivation、Cipher、RecommendedParameters、EncryptedStateInput、PrivateKeyExportInput、UnlockResult 和 DocumentSummary struct。
- 不使用 protector interface，不使用 `map[string]any` 作为验证后模型。

#### `go/constants.go`

- 与 TypeScript constants 和需求规格逐项一致。
- 不增加 Go 特有默认值或算法别名；推荐值不能成为省略参数时的隐式行为。

#### `go/errors.go`

- 定义可通过 typed error/`errors.Is` 检查的稳定 code。
- 错误文本不得包含敏感材料。

#### `go/encoding.go`

- 严格实现小写 hex 和 raw URL base64。
- decode 后重新 encode，确认 canonical 表达。
- 在普通反序列化前拒绝重复字段、未配对 surrogate 和非十进制整数 literal。

#### `go/validation.go`

- 拒绝未知字段并完成与 TypeScript 一致的结构、枚举、长度和交叉验证。
- iterations 使用明确宽度整数，不能受平台 `int` 宽度影响。

#### `go/secp256k1.go`

- 使用受维护库验证并派生 compressed public key，不自行实现曲线运算。

#### `go/aesgcm.go`

- 使用 `crypto/aes`、`cipher.NewGCM`、`crypto/rand`。
- additional data 传 `nil`。
- `Seal` 输出直接作为 `ciphertext || tag`；`Open` 前验证 48-byte 总长度。

#### `go/password.go`

- 按原始 UTF-8 bytes 使用 PBKDF2-HMAC-SHA-256。
- 参数全部来自 Document 或创建输入，不忽略 iterations。
- 提供与 TypeScript 语义一致的 `RecommendedParameters`，但导出调用仍必须显式传入返回对象。

#### `go/document.go`

- 实现 Parse、Validate、Serialize、Unlock、Summary，以及供两个导出入口共用的内部 Document builder。
- 不加入 protector 管理、多密码尝试、文件 IO、数据库或产品状态。

#### `go/export.go`

- 实现 `ExportEncryptedState` 与 `ExportPrivateKey`。
- 加密状态入口只验证 raw bytes、组装并序列化，不派生 key、不生成随机值、不进行加解密。
- 明文入口使用显式参数完成随机生成、KDF、加密和序列化。
- 两个入口复用同一个 Document builder、validator 和 serializer。

#### `go/*_test.go`

- 覆盖与 TypeScript 相同的行为和错误码。
- `export_test.go` 覆盖两种导出路径及其固定向量等价性。
- conformance test 直接读取同一 shared fixtures。

### 4.6 文档与 CI

#### `docs/SDK使用说明.md`

- 分别给出 TypeScript 和 Go 的加密状态导出、明文私钥导出、parse、unlock、serialize 示例。
- 示例必须显式调用推荐参数函数并把结果传入，不展示参数省略写法。
- 说明持久化和导出复用同一个 Document。
- 说明更换密码必须先解锁再完整重建。
- 所有示例使用公开测试私钥并标注不得用于生产。

#### `.github/workflows/ci.yml`

- TypeScript 执行 install、typecheck、build、test。
- Go 执行 fmt check、vet、test。
- 两种 SDK 都必须运行 shared fixtures；任一失败阻止合并。
- CI 不自动生成或回写 fixtures。

## 5. 怎么做

以下是同一次交付内的开发顺序，不是分阶段实施：

1. 以需求规格固定唯一 schema 和 fixture manifest。
2. 人工 review 固定密码学向量，明确 ciphertext/tag 合并布局。
3. 分别实现 TypeScript 与 Go 的严格 codec、validator 和 crypto。
4. 两种 SDK 消费同一 fixtures，消除所有行为和错误码差异。
5. 完成 SDK 使用说明、根命令和 CI。
6. 一次执行最终验收，通过后两个 SDK 同时发布。

## 6. 不能怎么做

- 不能保留 `protectors` 数组，即使数组长度限制为一也不允许。
- 不能保留 WebAuthn、Passkey、PRF、credential 或 RP ID 字段和代码。
- 不能支持多个密码、密码列表或顺序尝试。
- 不能支持一个 Document 多把私钥。
- 不能把 `format` 改成 `keyhold`。
- 不能增加 metadata、address、network、WIF、source、capabilities、createdAt 或 verifier。
- 不能增加 `cipherSalt`、隐藏 profile 或不参与运算的参数。
- 不能增加 AAD、JCS、checksum、独立 hash、签名、CEK 或 key-wrap。
- 不能把 GCM tag 删除；它必须作为 `ciphertextAndTagB64Url` 的末尾 16 bytes 保存。
- 不能把 tag 再复制到独立字段，形成两个真值。
- 不能猜测 hex/base64 或兼容错误编码。
- 不能自行实现 PBKDF2、AES-GCM 或 secp256k1 primitive。
- 不能让 TypeScript 与 Go 各自维护 schema、fixtures、错误码或推荐参数。
- 不能把推荐参数称为默认参数，不能在参数缺失时静默补齐。
- 不能在加密状态导出中执行 PBKDF2、解密、重新加密、生成随机值或替换调用方参数。
- 不能接收语义不兼容的产品密文后，仅凭字段长度声称它是有效 KeyHold 备份。
- 不能加入 legacy reader、migration、dual reader 或 dual writer。
- 不能先发布一种语言再补另一种语言。

## 7. 特殊情况预案

### 7.1 错误密码与文件损坏

- AES-GCM 失败、私钥非法和 public key mismatch 对外统一为 `unlock_failed`。
- 不通过不同错误提示帮助攻击者判断密码是否接近正确。

### 7.2 更换密码

- 必须先用旧密码解锁，再使用显式参数调用明文私钥导出，生成全新 salt、IV 和密文。
- 调用方负责原子替换，失败时保留旧 Document。
- 不允许只修改 iterations、salt 或 cipher 字段。

### 7.3 两种语言结果不一致

- 以需求规格、schema 和已经 review 的 fixture 为共同依据。
- 规范有歧义时先改需求与 fixture，再同时修改两个 SDK。
- 不增加语言特例或宽松 decoder 掩盖差异。

### 7.4 密码包含 Unicode

- 两种语言按同一 Unicode scalar sequence 的 UTF-8 bytes 处理。
- 不 normalization；视觉相同但码点不同的密码应产生不同 key。
- 未配对 surrogate/非法 UTF-8 必须在 KDF 前拒绝。

### 7.5 高 iterations

- 严格使用文件原值，不静默降低或替换。
- 当前格式不增加额外资源策略；采用方需要的外部限制不得改变 Document 语义。

### 7.6 随机源失败

- 明文私钥导出整体失败，不返回部分 Document。
- 不回退到时间、`Math.random` 或固定值。

### 7.7 序列化现有密文

- 字段顺序、空白和缩进不是安全语义。
- serialize 不解密、不刷新 salt/IV，确保导出复用当前存储密文。
- DB wrapper 字段必须留在 KeyHold Document 外部。

### 7.8 需求外输入

- 多密码、多私钥、未知算法、未知字段和其他格式一律拒绝。
- 不猜测它来自历史版本，不尝试迁移。

### 7.9 加密状态与 KeyHold 语义不兼容

- SDK 只做结构验证，无法在没有密码/private key 时证明密文身份。
- 产品适配层必须先确认 plaintext、KDF、AES key、AAD 和密文布局完全一致。
- 任一项不一致时必须走明文私钥导出；不得向 KeyHold SDK 增加产品专用兼容分支。

## 8. 最终验收清单

### 8.1 格式

- [x] schema 顶层恰好六个必填字段，不存在扩展入口。
- [x] `format` 固定 `keymaster`，`version` 固定整数 `2`。
- [x] 一个 Document 恰好一个 label、一个 public key、一个 KDF 和一个 cipher。
- [x] 不存在 protector 数组、WebAuthn 字段、多密码或多私钥结构。
- [x] public key 使用严格小写 hex，其余二进制使用严格无 padding base64url。
- [x] 所有参数名称、单位、范围和真实运算语义一致。

### 8.2 TypeScript SDK

- [x] install、typecheck、build 和 Vitest 全部通过。
- [x] 公共 API 包含 recommendedParameters、exportEncryptedState、exportPrivateKey、parse、validate、serialize、unlock、summary 及必要类型/错误。
- [x] 推荐参数必须显式传入；缺失参数不会自动补值。
- [x] WebCrypto 参数完全来自 Document/明文导出参数。
- [x] 运行时 validator 拒绝所有未知字段和错误参数。
- [x] 包内不存在 WebAuthn/protector 代码或不安全公开 helper。

### 8.3 Go SDK

- [x] `gofmt`、`go vet`、`go test ./...` 全部通过。
- [x] 公共能力与 TypeScript 语义一致。
- [x] `RecommendedParameters`、`ExportEncryptedState` 和 `ExportPrivateKey` 的显式参数语义正确。
- [x] iterations 不受平台 `int` 宽度影响。
- [x] package 不包含 WebAuthn、protector、文件 IO、DB 或产品状态。

### 8.4 密码学

- [x] plaintext 固定为合法 32-byte secp256k1 private key。
- [x] PBKDF2-HMAC-SHA-256 当前推荐 iterations 为 600,000，JSON 中始终保存实际值。
- [x] salt 16 bytes、IV 12 bytes，均来自安全随机源。
- [x] AES key 256 bits，GCM tag 128 bits。
- [x] `ciphertextAndTagB64Url` 恰好是 32-byte ciphertext 后接 16-byte tag。
- [x] AES-GCM additional data 为空。
- [x] 解锁后 public key 必须匹配，失败统一 `unlock_failed`。
- [x] 没有自研密码学 primitive。

### 8.5 跨语言一致性

- [x] 两种 SDK 读取并抽查同一 schema、manifest 和 fixtures。
- [x] 固定输入产生相同 PBKDF2 key、public key、ciphertext 和 tag。
- [x] 对同一固定加密状态，两种 SDK 组装出语义相同的 Document。
- [x] 固定随机材料下，两种导出路径生成相同 Document。
- [x] TypeScript 导出的 Document 可由 Go parse/validate/unlock。
- [x] Go 导出的 Document 可由 TypeScript parse/validate/unlock。
- [x] invalid fixtures 在两种语言返回相同稳定错误码。
- [x] Unicode 密码、重复字段、非法整数和 canonical base64url 行为一致。
- [x] JSON 空白和字段顺序差异不影响语义。

### 8.6 核心流程

- [x] 加密状态导出不接收密码/private key，不调用 KDF、AES-GCM 或随机源。
- [x] 明文私钥导出只接受一个密码，并要求调用方显式提供参数。
- [x] 两种导出方式最终使用同一 Document validator 和 serializer。
- [x] import/parse 不要求密码，不尝试解密或迁移。
- [x] unlock 只执行一次 KDF 和一次 AES-GCM 解密。
- [x] serialize 不解密、不重加密、不更新 salt/IV。
- [x] 更换密码只能通过解锁后重新执行明文私钥导出。

### 8.7 禁止项审计

- [x] 仓库不存在 WebAuthn、PRF、Passkey、credential、RP ID 或 protector 实现。
- [x] 不存在 metadata、address、network、WIF、verifier 或 cipherSalt 字段。
- [x] 不存在 AAD、JCS、checksum、签名、CEK/key-wrap 实现。
- [x] 不存在隐藏参数、编码猜测或 `format=keyhold` 正式输出。
- [x] 不存在 legacy、migration、dual reader 或 dual writer。
- [x] 不存在 TypeScript/Go 两份独立 schema、fixtures 或错误码。

### 8.8 发布门禁

- [x] 根 `make test` 一次运行两种语言全部测试并通过。
- [ ] CI 全绿（本地门禁已通过，待远程 CI 验证）。
- [x] README 和 SDK 使用说明足以让第三方独立完成创建、持久化、导出和解锁。
- [ ] TypeScript 与 Go 包版本同时发布且版本号一致（尚未完成远程推送、Git tag 和 registry 发布）。
- [x] 任一未完成项都会阻止硬切换发布。
