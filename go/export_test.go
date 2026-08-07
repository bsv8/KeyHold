package keyhold

import "testing"

func TestExportLifecycle(t *testing.T) {
	privateKey := make([]byte, 32)
	privateKey[31] = 1
	salt := make([]byte, 16)
	iv := make([]byte, 12)
	for i := range salt {
		salt[i] = byte(i)
	}
	for i := range iv {
		iv[i] = byte(i + 16)
	}
	input := PrivateKeyExportInput{PrivateKey: privateKey, Password: "päss🔑", Label: "Personal key", Parameters: Parameters{KeyDerivation: KeyDerivationParameters{Algorithm: KDFAlgorithm, PasswordEncoding: PasswordEncoding, Iterations: 1000, OutputLengthBits: OutputLengthBits}, Cipher: CipherParameters{Algorithm: CipherAlgorithm, KeyLengthBits: KeyLengthBits, TagLengthBits: TagLengthBits}}}
	jsonBytes, err := exportPrivateKeyWithRandom(input, salt, iv)
	if err != nil {
		t.Fatal(err)
	}
	document, err := Parse(jsonBytes)
	if err != nil {
		t.Fatal(err)
	}
	result, err := Unlock(document, input.Password)
	if err != nil || EncodeHex(result.PrivateKey) != EncodeHex(privateKey) {
		t.Fatal(err)
	}
	state := EncryptedStateInput{Label: input.Label, PublicKeyHex: document.PublicKeyHex, KeyDerivation: EncryptedKDFInput{Algorithm: KDFAlgorithm, PasswordEncoding: PasswordEncoding, Iterations: 1000, OutputLengthBits: OutputLengthBits, Salt: salt}, Cipher: EncryptedCipherInput{Algorithm: CipherAlgorithm, KeyLengthBits: KeyLengthBits, TagLengthBits: TagLengthBits, IV: iv, CiphertextAndTag: mustBytes(t, document.Cipher.CiphertextAndTagB64Url)}}
	stateJSON, err := ExportEncryptedState(state)
	if err != nil {
		t.Fatal(err)
	}
	if string(stateJSON) != string(jsonBytes) {
		t.Fatalf("export paths differ:\n%s\n%s", jsonBytes, stateJSON)
	}
}
func mustBytes(t *testing.T, value string) []byte {
	result, err := DecodeBase64URL(value, "ciphertextAndTag")
	if err != nil {
		t.Fatal(err)
	}
	return result
}
