package keyhold

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
)

func EncodeBase64URL(value []byte) string { return base64.RawURLEncoding.EncodeToString(value) }
func DecodeBase64URL(value, field string) ([]byte, error) {
	if strings.ContainsAny(value, "+/= \t\r\n") {
		return nil, E(ErrInvalidDocument, fmt.Sprintf("invalid %s", field), nil)
	}
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil || base64.RawURLEncoding.EncodeToString(decoded) != value {
		return nil, E(ErrInvalidDocument, fmt.Sprintf("invalid %s", field), err)
	}
	return decoded, nil
}
func EncodeHex(value []byte) string { return hex.EncodeToString(value) }
func DecodeHex(value, field string) ([]byte, error) {
	if value != strings.ToLower(value) || strings.HasPrefix(value, "0x") {
		return nil, E(ErrInvalidDocument, fmt.Sprintf("invalid %s", field), nil)
	}
	result, err := hex.DecodeString(value)
	if err != nil {
		return nil, E(ErrInvalidDocument, fmt.Sprintf("invalid %s", field), err)
	}
	return result, nil
}
func equalBytes(a, b []byte) bool { return bytes.Equal(a, b) }
