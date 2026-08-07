.PHONY: test test-ts test-go conformance build-ts fmt-check-go release-check

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

fmt-check-go:
	test -z "$$(gofmt -l go/*.go)"

release-check:
	node scripts/release-check.mjs
	cd typescript && npm pack --dry-run
	cd go && go test ./...
