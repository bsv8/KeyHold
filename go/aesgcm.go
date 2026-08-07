package keyhold

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
)

func randomBytes(length int) ([]byte, error) {
	value := make([]byte, length)
	if _, err := rand.Read(value); err != nil {
		return nil, E(ErrInvalidParameter, "secure random source failed", err)
	}
	return value, nil
}
func encryptAESGCMWithIV(key, plaintext, iv []byte) ([]byte, error) {
	if len(key) != KeyLengthBits/8 || len(plaintext) != PrivateKeyLengthBytes || len(iv) != IVLengthBytes {
		return nil, E(ErrInvalidParameter, "AES-GCM input length", nil)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, E(ErrUnsupportedAlgorithm, "AES-256 unavailable", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	joined := aead.Seal(nil, iv, plaintext, nil)
	if len(joined) != CiphertextAndTagLengthBytes {
		return nil, E(ErrInvalidParameter, "unexpected AES-GCM output", nil)
	}
	return joined, nil
}
func decryptAESGCM(key, iv, joined []byte) ([]byte, error) {
	if len(key) != KeyLengthBits/8 || len(iv) != IVLengthBytes || len(joined) != CiphertextAndTagLengthBytes {
		return nil, E(ErrUnlockFailed, "AES-GCM input length", nil)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	plaintext, err := aead.Open(nil, iv, joined, nil)
	if err != nil {
		return nil, E(ErrUnlockFailed, "cipher authentication failed", err)
	}
	if len(plaintext) != PrivateKeyLengthBytes {
		return nil, E(ErrUnlockFailed, "invalid decrypted private key", nil)
	}
	return plaintext, nil
}
