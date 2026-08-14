package keyhold

import (
	"encoding/json"
	"unicode/utf8"
)

// Serialize validates and encodes a document as canonical JSON.
func Serialize(document Document) ([]byte, error) {
	if err := Validate(document); err != nil {
		return nil, err
	}
	return json.Marshal(document)
}

// Summary returns the non-secret metadata of a validated document.
func Summary(document Document) (DocumentSummary, error) {
	if err := Validate(document); err != nil {
		return DocumentSummary{}, err
	}
	return DocumentSummary{Format: document.Format, Version: document.Version, Label: document.Label, PublicKeyHex: document.PublicKeyHex}, nil
}

func unlockResult(document Document, plaintext []byte) (*UnlockResult, error) {
	publicKey, err := PublicKeyFromPrivate(plaintext)
	if err != nil || EncodeHex(publicKey) != document.PublicKeyHex {
		return nil, E(ErrUnlockFailed, "private key does not match document public key", err)
	}
	return &UnlockResult{PrivateKey: plaintext, PublicKeyHex: EncodeHex(publicKey)}, nil
}

// Unlock decrypts a document and verifies that the recovered private key matches its public key.
func Unlock(document Document, password string) (*UnlockResult, error) {
	if err := Validate(document); err != nil {
		return nil, err
	}
	if password == "" || !utf8.ValidString(password) {
		return nil, E(ErrUnlockFailed, "unable to unlock document", nil)
	}
	salt, err := DecodeBase64URL(document.KeyDerivation.SaltB64Url, "saltB64Url")
	if err != nil {
		return nil, E(ErrUnlockFailed, "unable to unlock document", err)
	}
	key := derivePassword(password, salt, document.KeyDerivation.Iterations)
	iv, err := DecodeBase64URL(document.Cipher.IVB64Url, "ivB64Url")
	if err != nil {
		return nil, E(ErrUnlockFailed, "unable to unlock document", err)
	}
	joined, err := DecodeBase64URL(document.Cipher.CiphertextAndTagB64Url, "ciphertextAndTagB64Url")
	if err != nil {
		return nil, E(ErrUnlockFailed, "unable to unlock document", err)
	}
	plaintext, err := decryptAESGCM(key, iv, joined)
	if err != nil {
		return nil, E(ErrUnlockFailed, "unable to unlock document", err)
	}
	result, err := unlockResult(document, plaintext)
	if err != nil {
		return nil, E(ErrUnlockFailed, "unable to unlock document", err)
	}
	return result, nil
}
