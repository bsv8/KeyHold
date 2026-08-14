package keyhold

// KeyDerivation describes the password-based key derivation section.
type KeyDerivation struct {
	Algorithm        string `json:"algorithm"`
	PasswordEncoding string `json:"passwordEncoding"`
	Iterations       int64  `json:"iterations"`
	OutputLengthBits int    `json:"outputLengthBits"`
	SaltB64Url       string `json:"saltB64Url"`
}

// Cipher describes the AES-GCM section.
type Cipher struct {
	Algorithm              string `json:"algorithm"`
	KeyLengthBits          int    `json:"keyLengthBits"`
	IVB64Url               string `json:"ivB64Url"`
	TagLengthBits          int    `json:"tagLengthBits"`
	CiphertextAndTagB64Url string `json:"ciphertextAndTagB64Url"`
}

// Document is a complete, validated KeyHold keymaster v2 document.
type Document struct {
	Format        string        `json:"format"`
	Version       int           `json:"version"`
	Label         string        `json:"label"`
	PublicKeyHex  string        `json:"publicKeyHex"`
	KeyDerivation KeyDerivation `json:"keyDerivation"`
	Cipher        Cipher        `json:"cipher"`
}

// KeyDerivationParameters contains explicit KDF parameters for export.
type KeyDerivationParameters struct {
	Algorithm        string `json:"algorithm"`
	PasswordEncoding string `json:"passwordEncoding"`
	Iterations       int64  `json:"iterations"`
	OutputLengthBits int    `json:"outputLengthBits"`
}

// CipherParameters contains explicit cipher parameters for export.
type CipherParameters struct {
	Algorithm     string `json:"algorithm"`
	KeyLengthBits int    `json:"keyLengthBits"`
	TagLengthBits int    `json:"tagLengthBits"`
}

// Parameters contains the complete explicit export parameter set.
type Parameters struct {
	KeyDerivation KeyDerivationParameters
	Cipher        CipherParameters
}

// EncryptedKDFInput contains an already-derived document KDF section and raw salt.
type EncryptedKDFInput struct {
	Algorithm        string
	PasswordEncoding string
	Iterations       int64
	OutputLengthBits int
	Salt             []byte
}

// EncryptedCipherInput contains an already-encrypted document cipher section.
type EncryptedCipherInput struct {
	Algorithm        string
	KeyLengthBits    int
	IV               []byte
	TagLengthBits    int
	CiphertextAndTag []byte
}

// EncryptedStateInput describes encrypted state that can be serialized without decryption.
type EncryptedStateInput struct {
	Label         string
	PublicKeyHex  string
	KeyDerivation EncryptedKDFInput
	Cipher        EncryptedCipherInput
}

// PrivateKeyExportInput describes plaintext private-key export input.
type PrivateKeyExportInput struct {
	PrivateKey []byte
	Password   string
	Label      string
	Parameters Parameters
}

// UnlockResult contains the private key and its matching compressed public key.
type UnlockResult struct {
	PrivateKey   []byte
	PublicKeyHex string
}

// DocumentSummary contains the non-secret metadata of a document.
type DocumentSummary struct {
	Format       string
	Version      int
	Label        string
	PublicKeyHex string
}
