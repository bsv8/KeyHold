package keyhold

import "testing"

func TestEncodingCanonical(t *testing.T) {
	value := []byte{0, 1, 2, 250, 255}
	encoded := EncodeBase64URL(value)
	if encoded != "AAEC-v8" {
		t.Fatal(encoded)
	}
	decoded, err := DecodeBase64URL(encoded, "test")
	if err != nil || string(decoded) != string(value) {
		t.Fatal(err)
	}
	if _, err := DecodeBase64URL("AA==", "test"); ErrorCodeOf(err) != ErrInvalidDocument {
		t.Fatal(err)
	}
	if _, err := DecodeHex("0A", "test"); ErrorCodeOf(err) != ErrInvalidDocument {
		t.Fatal(err)
	}
}
