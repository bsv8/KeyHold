.PHONY: test test-ts test-go conformance build-ts docs docs-ts docs-go docs-site fmt-check-go release-check

test: test-ts test-go

test-ts:
	npm ci --prefix typescript
	npm run typecheck --prefix typescript
	npm run build --prefix typescript
	npm test --prefix typescript

test-go:
	cd go && go test ./...

conformance: test-ts test-go

build-ts:
	npm run build --prefix typescript

docs: docs-ts docs-go

docs-ts:
	npm run docs --prefix typescript

docs-go:
	cd go && go doc -all . >/dev/null

docs-site:
	npm ci --prefix docs-site
	npm run build --prefix docs-site

fmt-check-go:
	test -z "$$(gofmt -l go/*.go)"

release-check:
	npm ci --prefix typescript
	node scripts/release-check.mjs
	cd go && go test ./...
