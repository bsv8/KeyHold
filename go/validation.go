package keyhold

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"unicode/utf8"
)

// scanJSON rejects duplicate keys, non-canonical integer literals, invalid UTF-8,
// and unpaired Unicode surrogates before encoding/json sees the document.
type jsonScanner struct {
	data []byte
	pos  int
}

func (s *jsonScanner) fail() error { return fmt.Errorf("invalid JSON") }
func (s *jsonScanner) whitespace() {
	for s.pos < len(s.data) && (s.data[s.pos] == ' ' || s.data[s.pos] == '\t' || s.data[s.pos] == '\r' || s.data[s.pos] == '\n') {
		s.pos++
	}
}
func (s *jsonScanner) stringValue() (string, error) {
	start := s.pos
	if s.pos >= len(s.data) || s.data[s.pos] != '"' {
		return "", s.fail()
	}
	s.pos++
	for s.pos < len(s.data) {
		b := s.data[s.pos]
		s.pos++
		if b == '"' {
			raw := s.data[start:s.pos]
			var value string
			if err := json.Unmarshal(raw, &value); err != nil || !utf8.ValidString(value) {
				return "", s.fail()
			}
			return value, nil
		}
		if b < 0x20 {
			return "", s.fail()
		}
		if b != '\\' {
			continue
		}
		if s.pos >= len(s.data) {
			return "", s.fail()
		}
		escape := s.data[s.pos]
		s.pos++
		if escape != 'u' {
			if !bytes.ContainsRune([]byte{'"', '\\', '/', 'b', 'f', 'n', 'r', 't'}, rune(escape)) {
				return "", s.fail()
			}
			continue
		}
		if s.pos+4 > len(s.data) {
			return "", s.fail()
		}
		var code uint16
		for i := 0; i < 4; i++ {
			digit, ok := hexDigit(s.data[s.pos+i])
			if !ok {
				return "", s.fail()
			}
			code = code*16 + uint16(digit)
		}
		s.pos += 4
		if code >= 0xdc00 && code <= 0xdfff {
			return "", s.fail()
		}
		if code >= 0xd800 && code <= 0xdbff {
			if s.pos+6 > len(s.data) || s.data[s.pos] != '\\' || s.data[s.pos+1] != 'u' {
				return "", s.fail()
			}
			var low uint16
			for i := 0; i < 4; i++ {
				digit, ok := hexDigit(s.data[s.pos+2+i])
				if !ok {
					return "", s.fail()
				}
				low = low*16 + uint16(digit)
			}
			if low < 0xdc00 || low > 0xdfff {
				return "", s.fail()
			}
			s.pos += 6
		}
	}
	return "", s.fail()
}
func hexDigit(b byte) (int, bool) {
	switch {
	case b >= '0' && b <= '9':
		return int(b - '0'), true
	case b >= 'a' && b <= 'f':
		return int(b-'a') + 10, true
	case b >= 'A' && b <= 'F':
		return int(b-'A') + 10, true
	}
	return 0, false
}
func (s *jsonScanner) value() error {
	s.whitespace()
	if s.pos >= len(s.data) {
		return s.fail()
	}
	switch s.data[s.pos] {
	case '"':
		_, err := s.stringValue()
		return err
	case '{':
		return s.object()
	case '[':
		return s.array()
	case 't':
		return s.literal("true")
	case 'f':
		return s.literal("false")
	case 'n':
		return s.literal("null")
	default:
		if s.data[s.pos] == '-' || (s.data[s.pos] >= '0' && s.data[s.pos] <= '9') {
			return s.number()
		}
		return s.fail()
	}
}
func (s *jsonScanner) literal(value string) error {
	if !bytes.HasPrefix(s.data[s.pos:], []byte(value)) {
		return s.fail()
	}
	s.pos += len(value)
	return nil
}
func (s *jsonScanner) number() error {
	start := s.pos
	if s.data[s.pos] == '-' {
		s.pos++
		if s.pos >= len(s.data) {
			return s.fail()
		}
	}
	if s.data[s.pos] == '0' {
		s.pos++
	} else {
		if s.data[s.pos] < '1' || s.data[s.pos] > '9' {
			return s.fail()
		}
		for s.pos < len(s.data) && s.data[s.pos] >= '0' && s.data[s.pos] <= '9' {
			s.pos++
		}
	}
	if s.pos < len(s.data) && s.data[s.pos] == '.' {
		return s.fail()
	}
	if s.pos < len(s.data) && (s.data[s.pos] == 'e' || s.data[s.pos] == 'E') {
		return s.fail()
	}
	if s.pos == start || (s.data[start] == '-' && s.pos == start+1) {
		return s.fail()
	}
	return nil
}
func (s *jsonScanner) object() error {
	s.pos++
	s.whitespace()
	keys := map[string]bool{}
	if s.pos < len(s.data) && s.data[s.pos] == '}' {
		s.pos++
		return nil
	}
	for {
		s.whitespace()
		key, err := s.stringValue()
		if err != nil {
			return err
		}
		if keys[key] {
			return s.fail()
		}
		keys[key] = true
		s.whitespace()
		if s.pos >= len(s.data) || s.data[s.pos] != ':' {
			return s.fail()
		}
		s.pos++
		if err := s.value(); err != nil {
			return err
		}
		s.whitespace()
		if s.pos < len(s.data) && s.data[s.pos] == '}' {
			s.pos++
			return nil
		}
		if s.pos >= len(s.data) || s.data[s.pos] != ',' {
			return s.fail()
		}
		s.pos++
	}
}
func (s *jsonScanner) array() error {
	s.pos++
	s.whitespace()
	if s.pos < len(s.data) && s.data[s.pos] == ']' {
		s.pos++
		return nil
	}
	for {
		if err := s.value(); err != nil {
			return err
		}
		s.whitespace()
		if s.pos < len(s.data) && s.data[s.pos] == ']' {
			s.pos++
			return nil
		}
		if s.pos >= len(s.data) || s.data[s.pos] != ',' {
			return s.fail()
		}
		s.pos++
	}
}
func strictJSON(data []byte) error {
	if !utf8.Valid(data) {
		return fmt.Errorf("invalid UTF-8")
	}
	s := jsonScanner{data: data}
	if err := s.value(); err != nil {
		return err
	}
	s.whitespace()
	if s.pos != len(data) {
		return s.fail()
	}
	return nil
}

func objectKeys(data []byte) (map[string]json.RawMessage, error) {
	var value map[string]json.RawMessage
	if err := json.Unmarshal(data, &value); err != nil || value == nil {
		return nil, typeError("object")
	}
	return value, nil
}
func requireKeys(value map[string]json.RawMessage, allowed ...string) error {
	allowedSet := map[string]bool{}
	for _, key := range allowed {
		allowedSet[key] = true
	}
	for key := range value {
		if !allowedSet[key] {
			return E(ErrInvalidDocument, "unknown field", nil)
		}
	}
	for _, key := range allowed {
		if _, ok := value[key]; !ok {
			return E(ErrInvalidDocument, "required field missing", nil)
		}
	}
	return nil
}
func requireStringKeyword(value map[string]json.RawMessage, field, expected string, code ErrorCode) error {
	raw, ok := value[field]
	if !ok {
		return E(ErrInvalidDocument, "required field missing", nil)
	}
	var actual string
	if err := json.Unmarshal(raw, &actual); err != nil || actual != expected {
		return E(code, "unsupported value", err)
	}
	return nil
}
func requireIntegerKeyword(value map[string]json.RawMessage, field string, expected int, code ErrorCode) error {
	raw, ok := value[field]
	if !ok {
		return E(ErrInvalidDocument, "required field missing", nil)
	}
	var actual int
	if err := json.Unmarshal(raw, &actual); err != nil || actual != expected {
		return E(code, "unsupported value", err)
	}
	return nil
}
func decodeObject(data []byte, destination any, keys ...string) error {
	if err := strictJSON(data); err != nil {
		return E(ErrInvalidJSON, "document is not valid JSON", err)
	}
	value, err := objectKeys(data)
	if err != nil {
		return err
	}
	if err := requireKeys(value, keys...); err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return typeError("object")
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return E(ErrInvalidJSON, "trailing JSON", err)
	}
	return nil
}

func validateKDF(k KeyDerivation) error {
	if k.Algorithm != KDFAlgorithm {
		return E(ErrUnsupportedAlgorithm, "unsupported key derivation", nil)
	}
	if k.PasswordEncoding != PasswordEncoding {
		return E(ErrInvalidDocument, "invalid password encoding", nil)
	}
	if k.Iterations < MinIterations || k.Iterations > MaxIterations {
		return E(ErrInvalidDocument, "iterations out of range", nil)
	}
	if k.OutputLengthBits != OutputLengthBits {
		return E(ErrInvalidDocument, "invalid outputLengthBits", nil)
	}
	salt, err := DecodeBase64URL(k.SaltB64Url, "saltB64Url")
	if err != nil {
		return err
	}
	if len(salt) != SaltLengthBytes {
		return E(ErrInvalidDocument, "salt must be 16 bytes", nil)
	}
	return nil
}
func validateCipherValue(c Cipher) error {
	if c.Algorithm != CipherAlgorithm {
		return E(ErrUnsupportedAlgorithm, "unsupported AES-GCM parameters", nil)
	}
	if c.KeyLengthBits != KeyLengthBits || c.TagLengthBits != TagLengthBits {
		return E(ErrInvalidDocument, "invalid AES-GCM parameters", nil)
	}
	iv, err := DecodeBase64URL(c.IVB64Url, "ivB64Url")
	if err != nil {
		return err
	}
	joined, err := DecodeBase64URL(c.CiphertextAndTagB64Url, "ciphertextAndTagB64Url")
	if err != nil {
		return err
	}
	if len(iv) != IVLengthBytes || len(joined) != CiphertextAndTagLengthBytes {
		return E(ErrInvalidDocument, "invalid cipher byte length", nil)
	}
	return nil
}
func Validate(document Document) error {
	if document.Format != Format {
		return E(ErrUnsupportedFormat, "format must be keymaster", nil)
	}
	if document.Version != Version {
		return E(ErrUnsupportedVersion, "version must be 2", nil)
	}
	if document.Label == "" || !utf8.ValidString(document.Label) {
		return E(ErrInvalidDocument, "label must not be empty", nil)
	}
	if len(document.PublicKeyHex) != PublicKeyLengthBytes*2 {
		return E(ErrInvalidDocument, "publicKeyHex must be 33 bytes", nil)
	}
	if _, err := ValidatePublicKeyHex(document.PublicKeyHex); err != nil {
		return E(ErrInvalidDocument, "invalid public key", err)
	}
	if err := validateKDF(document.KeyDerivation); err != nil {
		return err
	}
	return validateCipherValue(document.Cipher)
}

func Parse(data []byte) (Document, error) {
	if err := strictJSON(data); err != nil {
		return Document{}, E(ErrInvalidJSON, "document is not valid JSON", err)
	}
	raw, err := objectKeys(data)
	if err != nil {
		return Document{}, E(ErrInvalidDocument, "document must be an object", err)
	}
	if err := requireKeys(raw, "format", "version", "label", "publicKeyHex", "keyDerivation", "cipher"); err != nil {
		return Document{}, err
	}
	if err := requireStringKeyword(raw, "format", Format, ErrUnsupportedFormat); err != nil {
		return Document{}, err
	}
	if err := requireIntegerKeyword(raw, "version", Version, ErrUnsupportedVersion); err != nil {
		return Document{}, err
	}
	kdfRaw, err := objectKeys(raw["keyDerivation"])
	if err != nil {
		return Document{}, typeError("keyDerivation")
	}
	if err := requireKeys(kdfRaw, "algorithm", "passwordEncoding", "iterations", "outputLengthBits", "saltB64Url"); err != nil {
		return Document{}, err
	}
	if err := requireStringKeyword(kdfRaw, "algorithm", KDFAlgorithm, ErrUnsupportedAlgorithm); err != nil {
		return Document{}, err
	}
	cipherRaw, err := objectKeys(raw["cipher"])
	if err != nil {
		return Document{}, typeError("cipher")
	}
	if err := requireKeys(cipherRaw, "algorithm", "keyLengthBits", "ivB64Url", "tagLengthBits", "ciphertextAndTagB64Url"); err != nil {
		return Document{}, err
	}
	if err := requireStringKeyword(cipherRaw, "algorithm", CipherAlgorithm, ErrUnsupportedAlgorithm); err != nil {
		return Document{}, err
	}
	var document Document
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&document); err != nil {
		return Document{}, typeError("document")
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return Document{}, E(ErrInvalidJSON, "trailing JSON", err)
	}
	return document, Validate(document)
}
