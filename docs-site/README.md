# KeyHold documentation site

One Docusaurus site documents the shared KeyHold protocol, TypeScript SDK, and Go SDK. English is the source locale; Simplified Chinese lives in `i18n/zh-CN` and in the structured API catalog.

## Local workflow

```bash
npm ci
npm run dev
npm run check
npm run build
npm run serve
```

`npm run api:generate` regenerates both API references before checks and builds. Generated API pages under `docs/api/` and `i18n/zh-CN/docusaurus-plugin-content-docs/current/api/` are not hand-edited; update TypeScript JSDoc or Go doc comments instead.

## Structure

- `docs/` contains English guides, concepts, the operation map, and release notes.
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/` contains Chinese guide translations.
- `i18n/api.zh-CN.json` is a qualified catalog. Every entry is keyed by `sdk.kind.symbol` (with qualified field/parameter keys) and stores `{source, translation}`; source text is checked for staleness.
- `src/data/operations.json` is the small semantic manifest. It stores categories, English purpose, and each SDK's `kind` plus `symbol`. The generator derives signatures, input/output contracts, and hrefs into ignored `operations.generated.json`.
- `src/components/OperationMap` renders one SDK at a time, with a compact comparison disclosure. Docusaurus `groupId="sdk"` and `queryString="sdk"` persist and share the selected SDK.

## Translation workflow

Keep source comments in English. Run `npm run api:generate`, then update the matching qualified catalog entry's `translation` (never its `source`) when a summary, field, or parameter changes. `npm run check:i18n` fails on missing, orphan, stale, empty, or non-Chinese entries. `scripts/rebuild-catalog.mjs` synchronizes source keys safely: it preserves a translation only when the previous source is byte-for-byte identical; new or changed sources become empty and require manual translation. Translate guide and concept pages under the Docusaurus `i18n/zh-CN` tree. Do not translate function/type/field names, error codes, signatures, or code blocks.

TypeScript API metadata is produced by TypeDoc from `../typescript/src/index.ts`. Go metadata is produced by `scripts/go-api-metadata.go`, using the standard-library parser/AST and doc comments. Generated API Markdown is recreated on every check/build and must not be edited.

## Configuration and deployment

`DOCS_URL` and `DOCS_BASE_URL` configure the canonical URL and static-host base path. `DOCS_GITHUB_OWNER`, `DOCS_GITHUB_REPO`, `DOCS_GITHUB_BRANCH`, and `DOCS_DEPLOY_BRANCH` configure repository edit links and deployment metadata. Docusaurus builds both `en` and `zh-CN` locales, with broken links configured to fail the build.

The site intentionally does not commit `build/`, `.docusaurus/`, `node_modules/`, or generated API output. Use the root `make docs-site` target for CI-compatible installation and build.
