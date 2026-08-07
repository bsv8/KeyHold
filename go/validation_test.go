package keyhold

import (
	"errors"
	"testing"
)

func TestStrictValidation(t *testing.T) {
	if _, err := Parse([]byte(`{"format":"keymaster","format":"keymaster"}`)); ErrorCodeOf(err) != ErrInvalidJSON {
		t.Fatalf("duplicate key: %v", err)
	}
	if _, err := Parse(fixtureData(t, "invalid/unknown-field.json")); ErrorCodeOf(err) != ErrInvalidDocument {
		t.Fatal(err)
	}
	if _, err := Parse(fixtureData(t, "valid/basic.json")); err != nil {
		t.Fatal(err)
	}
}

func TestValidateRejectsInvalidUTF8InMemory(t *testing.T) {
	document, err := Parse(fixtureData(t, "valid/basic.json"))
	if err != nil {
		t.Fatal(err)
	}
	document.Label = string([]byte{0xff})
	if ErrorCodeOf(Validate(document)) != ErrInvalidDocument {
		t.Fatal("invalid UTF-8 label was accepted")
	}
}

func TestErrorsIsMatchesStableCode(t *testing.T) {
	_, err := Parse(fixtureData(t, "invalid/unknown-field.json"))
	if !errors.Is(err, ErrInvalidDocument) {
		t.Fatal("errors.Is did not match invalid_document")
	}
}
