// Package keyhold implements the KeyHold keymaster v2 document format.
//
// A KeyHold document stores one secp256k1 private key encrypted with one
// password. The package validates, serializes, exports, and unlocks documents;
// it does not perform file or database I/O.
package keyhold
