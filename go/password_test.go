package keyhold

import (
	"encoding/json"
	"testing"
)

func TestPasswordVector(t *testing.T) {
	var vector struct {
		Password         string `json:"password"`
		SaltB64Url       string `json:"saltB64Url"`
		Iterations       int64  `json:"iterations"`
		DerivedKeyB64Url string `json:"derivedKeyB64Url"`
	}
	if err := decodeFixtureJSON(t, "vectors/password.json", &vector); err != nil {
		t.Fatal(err)
	}
	salt, err := DecodeBase64URL(vector.SaltB64Url, "salt")
	if err != nil {
		t.Fatal(err)
	}
	if got := EncodeBase64URL(derivePassword(vector.Password, salt, vector.Iterations)); got != vector.DerivedKeyB64Url {
		t.Fatalf("derived key: %s", got)
	}
}

func decodeFixtureJSON(t *testing.T, name string, destination any) error {
	return json.Unmarshal(fixtureData(t, name), destination)
}
