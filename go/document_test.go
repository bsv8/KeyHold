package keyhold

import (
	"bytes"
	"testing"
)

func TestDocumentCrossLanguageFixture(t *testing.T) {
	document, err := Parse(fixtureData(t, "valid/basic.json"))
	if err != nil {
		t.Fatal(err)
	}
	result, err := Unlock(document, "päss🔑")
	if err != nil {
		t.Fatal(err)
	}
	if EncodeHex(result.PrivateKey) != "0000000000000000000000000000000000000000000000000000000000000001" {
		t.Fatal("unexpected private key")
	}
	serialized, err := Serialize(document)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(serialized, bytes.TrimSpace(fixtureData(t, "valid/basic.json"))) {
		t.Fatal("serialized fixture drifted")
	}
}
