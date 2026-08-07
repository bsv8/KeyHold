package keyhold

type KeyDerivation struct {
	Algorithm        string `json:"algorithm"`
	PasswordEncoding string `json:"passwordEncoding"`
	Iterations       int64  `json:"iterations"`
	OutputLengthBits int    `json:"outputLengthBits"`
	SaltB64Url       string `json:"saltB64Url"`
}

type Cipher struct {
	Algorithm              string `json:"algorithm"`
	KeyLengthBits          int    `json:"keyLengthBits"`
	IVB64Url               string `json:"ivB64Url"`
	TagLengthBits          int    `json:"tagLengthBits"`
	CiphertextAndTagB64Url string `json:"ciphertextAndTagB64Url"`
}

type Document struct {
	Format        string        `json:"format"`
	Version       int           `json:"version"`
	Label         string        `json:"label"`
	PublicKeyHex  string        `json:"publicKeyHex"`
	KeyDerivation KeyDerivation `json:"keyDerivation"`
	Cipher        Cipher        `json:"cipher"`
}

type KeyDerivationParameters struct {
	Algorithm        string `json:"algorithm"`
	PasswordEncoding string `json:"passwordEncoding"`
	Iterations       int64  `json:"iterations"`
	OutputLengthBits int    `json:"outputLengthBits"`
}

type CipherParameters struct {
	Algorithm     string `json:"algorithm"`
	KeyLengthBits int    `json:"keyLengthBits"`
	TagLengthBits int    `json:"tagLengthBits"`
}

type Parameters struct {
	KeyDerivation KeyDerivationParameters
	Cipher        CipherParameters
}

type EncryptedKDFInput struct {
	Algorithm        string
	PasswordEncoding string
	Iterations       int64
	OutputLengthBits int
	Salt             []byte
}

type EncryptedCipherInput struct {
	Algorithm        string
	KeyLengthBits    int
	IV               []byte
	TagLengthBits    int
	CiphertextAndTag []byte
}

type EncryptedStateInput struct {
	Label         string
	PublicKeyHex  string
	KeyDerivation EncryptedKDFInput
	Cipher        EncryptedCipherInput
}

type PrivateKeyExportInput struct {
	PrivateKey []byte
	Password   string
	Label      string
	Parameters Parameters
}

type UnlockResult struct {
	PrivateKey   []byte
	PublicKeyHex string
}

type DocumentSummary struct {
	Format       string
	Version      int
	Label        string
	PublicKeyHex string
}
