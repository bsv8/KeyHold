package keyhold

import (
	secp "github.com/decred/dcrd/dcrec/secp256k1/v4"
	"math/big"
)

// PublicKeyFromPrivate derives a compressed secp256k1 public key.
func PublicKeyFromPrivate(privateKey []byte) ([]byte, error) {
	if len(privateKey) != PrivateKeyLengthBytes {
		return nil, E(ErrInvalidPrivateKey, "private key must be 32 bytes", nil)
	}
	d := new(big.Int).SetBytes(privateKey)
	if d.Sign() <= 0 || d.Cmp(secp.Params().N) >= 0 {
		return nil, E(ErrInvalidPrivateKey, "private key is outside secp256k1 range", nil)
	}
	key := secp.PrivKeyFromBytes(privateKey)
	return key.PubKey().SerializeCompressed(), nil
}

// ValidatePublicKeyHex validates and decodes a compressed secp256k1 public key.
func ValidatePublicKeyHex(value string) ([]byte, error) {
	bytes, err := DecodeHex(value, "publicKeyHex")
	if err != nil {
		return nil, err
	}
	if len(bytes) != PublicKeyLengthBytes || (bytes[0] != 2 && bytes[0] != 3) {
		return nil, E(ErrInvalidDocument, "invalid compressed public key", nil)
	}
	key, err := secp.ParsePubKey(bytes)
	if err != nil || len(key.SerializeCompressed()) != PublicKeyLengthBytes || !equalBytes(key.SerializeCompressed(), bytes) {
		return nil, E(ErrInvalidDocument, "invalid secp256k1 public key", err)
	}
	return bytes, nil
}
