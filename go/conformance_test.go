package keyhold

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func fixtureData(t *testing.T, name string) []byte {
	t.Helper()
	value, err := os.ReadFile(filepath.Join("..", "fixtures", filepath.FromSlash(name)))
	if err != nil {
		t.Fatal(err)
	}
	return value
}

type manifestItem struct {
	File      string    `json:"file"`
	Parse     string    `json:"parse"`
	ErrorCode ErrorCode `json:"errorCode"`
}
type manifest struct {
	Vectors []manifestItem `json:"vectors"`
	Valid   []manifestItem `json:"valid"`
	Invalid []manifestItem `json:"invalid"`
}

func TestSharedConformance(t *testing.T) {
	var value manifest
	if err := json.Unmarshal(fixtureData(t, "manifest.json"), &value); err != nil {
		t.Fatal(err)
	}
	for _, item := range value.Vectors {
		t.Run("vector/"+item.File, func(t *testing.T) {
			var vector struct {
				ID                    string `json:"id"`
				PrivateKeyHex         string `json:"privateKeyHex"`
				Password              string `json:"password"`
				PasswordNFCEquivalent string `json:"passwordNfcEquivalent"`
				SaltB64Url            string `json:"saltB64Url"`
				Iterations            int64  `json:"iterations"`
				DerivedKeyB64Url      string `json:"derivedKeyB64Url"`
				IVB64Url              string `json:"ivB64Url"`
				Label                 string `json:"label"`
			}
			if err := json.Unmarshal(fixtureData(t, item.File), &vector); err != nil {
				t.Fatal(err)
			}
			salt, err := DecodeBase64URL(vector.SaltB64Url, "salt")
			if err != nil {
				t.Fatal(err)
			}
			parameters := RecommendedParameters()
			parameters.KeyDerivation.Iterations = vector.Iterations
			derived := derivePassword(vector.Password, salt, vector.Iterations)
			if vector.DerivedKeyB64Url != "" && EncodeBase64URL(derived) != vector.DerivedKeyB64Url {
				t.Fatal("PBKDF2 vector mismatch")
			}
			if vector.PasswordNFCEquivalent != "" && bytes.Equal(derived, derivePassword(vector.PasswordNFCEquivalent, salt, vector.Iterations)) {
				t.Fatal("Unicode normalization was applied")
			}
			if vector.ID == "password" {
				document, err := Parse(fixtureData(t, "valid/basic.json"))
				if err != nil {
					t.Fatal(err)
				}
				result, err := Unlock(document, vector.Password)
				if err != nil || EncodeHex(result.PrivateKey) != vector.PrivateKeyHex {
					t.Fatalf("password vector unlock failed: %v", err)
				}
			}
			if vector.ID == "export-equivalence" {
				iv, err := DecodeBase64URL(vector.IVB64Url, "iv")
				if err != nil {
					t.Fatal(err)
				}
				privateKey, err := DecodeHex(vector.PrivateKeyHex, "privateKey")
				if err != nil {
					t.Fatal(err)
				}
				input := PrivateKeyExportInput{PrivateKey: privateKey, Password: vector.Password, Label: vector.Label, Parameters: parameters}
				generated, err := exportPrivateKeyWithRandom(input, salt, iv)
				if err != nil {
					t.Fatal(err)
				}
				expected := bytes.TrimSpace(fixtureData(t, "valid/basic.json"))
				if !bytes.Equal(generated, expected) {
					t.Fatal("plaintext export does not match shared vector")
				}
				document, err := Parse(generated)
				if err != nil {
					t.Fatal(err)
				}
				result, err := Unlock(document, vector.Password)
				if err != nil || EncodeHex(result.PrivateKey) != vector.PrivateKeyHex {
					t.Fatalf("generated document does not unlock: %v", err)
				}
				joined, err := DecodeBase64URL(document.Cipher.CiphertextAndTagB64Url, "ciphertextAndTag")
				if err != nil {
					t.Fatal(err)
				}
				state, err := ExportEncryptedState(EncryptedStateInput{Label: document.Label, PublicKeyHex: document.PublicKeyHex, KeyDerivation: EncryptedKDFInput{Algorithm: KDFAlgorithm, PasswordEncoding: PasswordEncoding, Iterations: vector.Iterations, OutputLengthBits: OutputLengthBits, Salt: salt}, Cipher: EncryptedCipherInput{Algorithm: CipherAlgorithm, KeyLengthBits: KeyLengthBits, TagLengthBits: TagLengthBits, IV: iv, CiphertextAndTag: joined}})
				if err != nil || !bytes.Equal(state, expected) {
					t.Fatalf("encrypted-state export does not match shared vector: %v", err)
				}
			}
		})
	}
	for _, item := range value.Valid {
		t.Run(item.File, func(t *testing.T) {
			if _, err := Parse(fixtureData(t, item.File)); err != nil {
				t.Fatal(err)
			}
		})
	}
	for _, item := range value.Invalid {
		t.Run(item.File, func(t *testing.T) {
			document, err := Parse(fixtureData(t, item.File))
			if item.Parse == "success" {
				if err != nil {
					t.Fatal(err)
				}
				if _, err := Unlock(document, "päss🔑"); ErrorCodeOf(err) != ErrUnlockFailed {
					t.Fatalf("unlock code: %v", err)
				}
				return
			}
			if ErrorCodeOf(err) != item.ErrorCode {
				t.Fatalf("expected %s, got %v", item.ErrorCode, err)
			}
		})
	}
}
