package keyhold

const (
	Format                      = "keymaster"
	Version                     = 2
	KDFAlgorithm                = "pbkdf2-hmac-sha-256"
	PasswordEncoding            = "utf-8"
	CipherAlgorithm             = "aes-gcm"
	KeyLengthBits               = 256
	OutputLengthBits            = 256
	TagLengthBits               = 128
	MinIterations               = int64(1)
	MaxIterations               = int64(2147483647)
	RecommendedIterations       = int64(600000)
	SaltLengthBytes             = 16
	IVLengthBytes               = 12
	PrivateKeyLengthBytes       = 32
	PublicKeyLengthBytes        = 33
	CiphertextAndTagLengthBytes = 48
	TagLengthBytes              = 16
)
