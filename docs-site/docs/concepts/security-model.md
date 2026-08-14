---
id: security-model
title: Security model
sidebar_label: Security model
---

# Security model

KeyHold protects a private key at rest with password-based encryption and authenticated ciphertext. It does not manage passwords, rotate keys, persist files, or provide a hardware-backed secret store.

The security boundary is intentionally narrow:

- the password and plaintext private key stay with the calling application;
- document parsing is strict before cryptographic work begins;
- AES-GCM authentication must succeed before plaintext is returned;
- the derived public key must match `publicKeyHex` before unlock succeeds;
- stable error codes let callers handle failure without parsing message text.

Threat modeling, password policy, memory hygiene, transport security, and access control remain application responsibilities.
