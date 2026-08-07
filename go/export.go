package keyhold

import (
	"encoding/json"
	"unicode/utf8"
)

func RecommendedParameters() Parameters {
	return Parameters{KeyDerivation: KeyDerivationParameters{Algorithm: KDFAlgorithm, PasswordEncoding: PasswordEncoding, Iterations: RecommendedIterations, OutputLengthBits: OutputLengthBits}, Cipher: CipherParameters{Algorithm: CipherAlgorithm, KeyLengthBits: KeyLengthBits, TagLengthBits: TagLengthBits}}
}
func buildDocument(label, publicKeyHex string, kdf KeyDerivation, cipherValue Cipher) (Document, error) {
	document := Document{Format: Format, Version: Version, Label: label, PublicKeyHex: publicKeyHex, KeyDerivation: kdf, Cipher: cipherValue}
	if err := Validate(document); err != nil {
		return Document{}, err
	}
	return document, nil
}

func ExportEncryptedState(input EncryptedStateInput) ([]byte, error) {
	parameters := Parameters{KeyDerivation: KeyDerivationParameters{Algorithm: input.KeyDerivation.Algorithm, PasswordEncoding: input.KeyDerivation.PasswordEncoding, Iterations: input.KeyDerivation.Iterations, OutputLengthBits: input.KeyDerivation.OutputLengthBits}, Cipher: CipherParameters{Algorithm: input.Cipher.Algorithm, KeyLengthBits: input.Cipher.KeyLengthBits, TagLengthBits: input.Cipher.TagLengthBits}}
	if err := validateParameters(parameters); err != nil {
		return nil, err
	}
	if !utf8ValidAndNonEmpty(input.Label) {
		return nil, E(ErrInvalidParameter, "label must be a non-empty Unicode scalar sequence", nil)
	}
	if len(input.KeyDerivation.Salt) != SaltLengthBytes || len(input.Cipher.IV) != IVLengthBytes || len(input.Cipher.CiphertextAndTag) != CiphertextAndTagLengthBytes {
		return nil, E(ErrInvalidParameter, "invalid encrypted state byte length", nil)
	}
	document, err := buildDocument(input.Label, input.PublicKeyHex, KeyDerivation{Algorithm: input.KeyDerivation.Algorithm, PasswordEncoding: input.KeyDerivation.PasswordEncoding, Iterations: input.KeyDerivation.Iterations, OutputLengthBits: input.KeyDerivation.OutputLengthBits, SaltB64Url: EncodeBase64URL(input.KeyDerivation.Salt)}, Cipher{Algorithm: input.Cipher.Algorithm, KeyLengthBits: input.Cipher.KeyLengthBits, IVB64Url: EncodeBase64URL(input.Cipher.IV), TagLengthBits: input.Cipher.TagLengthBits, CiphertextAndTagB64Url: EncodeBase64URL(input.Cipher.CiphertextAndTag)})
	if err != nil {
		return nil, err
	}
	return json.Marshal(document)
}
func utf8ValidAndNonEmpty(value string) bool { return value != "" && utf8.ValidString(value) }
func ExportPrivateKey(input PrivateKeyExportInput) ([]byte, error) {
	salt, err := randomBytes(SaltLengthBytes)
	if err != nil {
		return nil, err
	}
	iv, err := randomBytes(IVLengthBytes)
	if err != nil {
		return nil, err
	}
	return exportPrivateKeyWithRandom(input, salt, iv)
}
func exportPrivateKeyWithRandom(input PrivateKeyExportInput, salt, iv []byte) ([]byte, error) {
	if err := validateParameters(input.Parameters); err != nil {
		return nil, err
	}
	if err := validateText(input.Label, input.Password); err != nil {
		return nil, err
	}
	if len(salt) != SaltLengthBytes || len(iv) != IVLengthBytes {
		return nil, E(ErrInvalidParameter, "invalid random byte length", nil)
	}
	publicKey, err := PublicKeyFromPrivate(input.PrivateKey)
	if err != nil {
		return nil, err
	}
	key := derivePassword(input.Password, salt, input.Parameters.KeyDerivation.Iterations)
	joined, err := encryptAESGCMWithIV(key, input.PrivateKey, iv)
	if err != nil {
		return nil, err
	}
	document, err := buildDocument(input.Label, EncodeHex(publicKey), KeyDerivation{Algorithm: input.Parameters.KeyDerivation.Algorithm, PasswordEncoding: input.Parameters.KeyDerivation.PasswordEncoding, Iterations: input.Parameters.KeyDerivation.Iterations, OutputLengthBits: input.Parameters.KeyDerivation.OutputLengthBits, SaltB64Url: EncodeBase64URL(salt)}, Cipher{Algorithm: input.Parameters.Cipher.Algorithm, KeyLengthBits: input.Parameters.Cipher.KeyLengthBits, IVB64Url: EncodeBase64URL(iv), TagLengthBits: input.Parameters.Cipher.TagLengthBits, CiphertextAndTagB64Url: EncodeBase64URL(joined)})
	if err != nil {
		return nil, err
	}
	return json.Marshal(document)
}
