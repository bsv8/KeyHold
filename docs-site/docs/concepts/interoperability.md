---
id: interoperability
title: Interoperability
sidebar_label: Interoperability
---

# Interoperability

The TypeScript and Go SDKs are two views over one wire format. A document exported by one can be parsed, validated, and unlocked by the other when the same password is supplied.

Keep cross-language tests focused on the protocol boundary:

1. Export a document with one SDK.
2. Parse and validate it with the other.
3. Unlock it and compare the recovered public key.
4. Serialize and compare canonical JSON where the fixture requires it.

The [operation map](/operations) calls out where the calling contracts differ: TypeScript uses `Promise` and `unknown` at its validation boundary; Go uses `error` and a decoded `Document`.
