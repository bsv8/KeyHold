package keyhold

import "fmt"

// ErrorCode is a stable category of KeyHold failure.
type ErrorCode string

func (c ErrorCode) Error() string { return string(c) }

const (
	ErrInvalidJSON          ErrorCode = "invalid_json"
	ErrUnsupportedFormat    ErrorCode = "unsupported_format"
	ErrUnsupportedVersion   ErrorCode = "unsupported_version"
	ErrInvalidDocument      ErrorCode = "invalid_document"
	ErrInvalidParameter     ErrorCode = "invalid_parameter"
	ErrUnsupportedAlgorithm ErrorCode = "unsupported_algorithm"
	ErrInvalidPrivateKey    ErrorCode = "invalid_private_key"
	ErrUnlockFailed         ErrorCode = "unlock_failed"
)

// KeyHoldError is an SDK error with a stable code and optional cause.
type KeyHoldError struct {
	Code    ErrorCode
	Message string
	Cause   error
}

func (e *KeyHoldError) Error() string {
	if e.Message != "" {
		return string(e.Code) + ": " + e.Message
	}
	return string(e.Code)
}
func (e *KeyHoldError) Unwrap() error { return e.Cause }
func (e *KeyHoldError) Is(target error) bool {
	switch value := target.(type) {
	case ErrorCode:
		return e.Code == value
	case *KeyHoldError:
		return value != nil && e.Code == value.Code
	default:
		return false
	}
}

// E constructs a KeyHoldError with an optional underlying cause.
func E(code ErrorCode, message string, cause error) *KeyHoldError {
	return &KeyHoldError{Code: code, Message: message, Cause: cause}
}

// ErrorCodeOf returns the first KeyHold error code in an unwrap chain.
func ErrorCodeOf(err error) ErrorCode {
	for err != nil {
		if e, ok := err.(*KeyHoldError); ok {
			return e.Code
		}
		u, ok := err.(interface{ Unwrap() error })
		if !ok {
			break
		}
		err = u.Unwrap()
	}
	return ""
}
func typeError(name string) error {
	return E(ErrInvalidDocument, fmt.Sprintf("%s has invalid type", name), nil)
}
