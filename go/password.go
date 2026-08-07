package keyhold

import (
	"crypto/sha256"
	"golang.org/x/crypto/pbkdf2"
	"unicode/utf8"
)

func derivePassword(password string, salt []byte, iterations int64) []byte {
	return pbkdf2.Key([]byte(password), salt, int(iterations), OutputLengthBits/8, sha256.New)
}
func validateParameters(parameters Parameters) error {
	if parameters.KeyDerivation.Algorithm != KDFAlgorithm || parameters.KeyDerivation.PasswordEncoding != PasswordEncoding || parameters.KeyDerivation.OutputLengthBits != OutputLengthBits || parameters.KeyDerivation.Iterations < MinIterations || parameters.KeyDerivation.Iterations > MaxIterations {
		return E(ErrInvalidParameter, "invalid key derivation parameters", nil)
	}
	if parameters.Cipher.Algorithm != CipherAlgorithm || parameters.Cipher.KeyLengthBits != KeyLengthBits || parameters.Cipher.TagLengthBits != TagLengthBits {
		return E(ErrInvalidParameter, "invalid cipher parameters", nil)
	}
	return nil
}
func validateText(label, password string) error {
	if !utf8.ValidString(label) || label == "" {
		return E(ErrInvalidParameter, "label must be a non-empty Unicode scalar sequence", nil)
	}
	if password == "" || !utf8.ValidString(password) {
		return E(ErrInvalidParameter, "password must be a non-empty Unicode scalar sequence", nil)
	}
	return nil
}
