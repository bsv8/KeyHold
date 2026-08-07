# KeyHold 发布门禁

`versions.json` 是 TypeScript 与 Go 发布版本的单一人工事实源。修改发布版本时，先同步它，再执行：

```sh
make release-check
```

该命令只检查本地版本一致性、npm 包内容和 Go 测试，不会创建 Git tag、推送远程分支或发布 registry 包。

正式发布前必须满足以下条件：

1. 工作区干净，提交已进入远程 `main`。
2. `v2.0.0` tag 尚不存在，并在发布提交上创建。
3. `@bsv8/keyhold@2.0.0` 尚未发布，然后发布 npm 包。
4. Go module 使用 `github.com/bsv8/KeyHold/go/v2`，并与同一版本 tag 一起发布。
5. 发布后分别验证 npm registry、Go proxy 和远程 CI。

TypeScript 与 Go 必须作为同一个版本批次发布；任一包未完成发布，都不能将施工单标记为最终验收通过。
