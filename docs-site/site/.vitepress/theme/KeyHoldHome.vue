<script setup lang="ts">
import { withBase } from "vitepress";

const sourceUrl = __KEYHOLD_SOURCE_URL__;

const capabilities = [
  ["Format", "Canonical JSON with an explicit version and discriminator", "format · v2"],
  ["Export", "Encrypt one secp256k1 private key with one password", "exportPrivateKey"],
  ["Unlock", "Recover and verify the key after authenticated decryption", "unlock · summary"],
  ["Validation", "Reject malformed, ambiguous, or unsupported documents", "parse · validate"],
  ["SDKs", "Equivalent TypeScript and Go implementations", "TS · Go"]
];
</script>

<template>
  <main class="keyhold-home">
    <section class="keyhold-hero" aria-labelledby="keyhold-title">
      <div class="protocol-field" aria-hidden="true">
        <div class="protocol-orbit orbit-one" />
        <div class="protocol-orbit orbit-two" />
        <div class="protocol-node node-a">INPUT</div>
        <div class="protocol-node node-b">DOCUMENT</div>
        <div class="protocol-node node-c">KEYHOLD</div>
        <div class="protocol-packet packet-one">input · private key</div>
        <div class="protocol-packet packet-two">result · document</div>
        <div class="protocol-packet packet-three">verify · public key</div>
      </div>

      <div class="hero-copy">
        <p class="hero-kicker">keyhold · TypeScript + Go SDK</p>
        <h1 id="keyhold-title">One file.<br><span>Nothing else.</span></h1>
        <p class="hero-summary">
          A minimal, explicit backup format for one secp256k1 private key,
          protected by one password and implemented by the SDK.
        </p>
        <div class="hero-actions">
          <a class="primary-action" :href="withBase('/guide/getting-started')">Start integrating <span>→</span></a>
          <a class="secondary-action" :href="withBase('/api/')">Read the API</a>
        </div>
        <div class="install-line" aria-label="Install package">
          <span class="prompt">$</span>
          <code>npm install keyhold</code>
        </div>
      </div>

      <p class="hero-footnote">JSON DOCUMENT · PBKDF2-HMAC-SHA-256 · AES-256-GCM</p>
    </section>

    <section class="capability-section" aria-labelledby="capability-title">
      <div class="section-intro">
        <p class="section-index">01 / SDK SURFACE</p>
        <h2 id="capability-title">One document.<br>Five clear boundaries.</h2>
        <p>KeyHold keeps format rules, encryption, validation, and cross-language behavior in one small contract.</p>
      </div>
      <div class="capability-list">
        <a v-for="([title, detail, methods], index) in capabilities" :key="title" :href="withBase('/guide/getting-started')" class="capability-row">
          <span class="row-number">0{{ index + 1 }}</span>
          <strong>{{ title }}</strong>
          <span class="row-detail">{{ detail }}</span>
          <code>{{ methods }}</code>
          <span class="row-arrow">↗</span>
        </a>
      </div>
    </section>

    <section class="flow-section" aria-labelledby="flow-title">
      <div class="flow-heading">
        <p class="section-index">02 / DOCUMENT MODEL</p>
        <h2 id="flow-title">The JSON is portable.<br>The SDK is the boundary.</h2>
      </div>
      <ol class="flow-steps">
        <li>
          <span>01</span>
          <h3>Define</h3>
          <p>Choose explicit KDF and cipher parameters. The format has no hidden defaults.</p>
        </li>
        <li>
          <span>02</span>
          <h3>Export</h3>
          <p>Pass a private key, password, label, and parameters to the SDK. It creates the complete document.</p>
        </li>
        <li>
          <span>03</span>
          <h3>Verify</h3>
          <p>Parse, unlock, and check the derived public key. No file I/O or storage policy is hidden inside.</p>
        </li>
      </ol>
    </section>

    <section class="final-section">
      <p class="section-index">03 / BUILD</p>
      <h2>The format is the contract.<br>The SDK keeps it honest.</h2>
      <p>Every reference page is generated directly from the TypeScript package exports, with the Go package following the same model.</p>
      <div class="final-actions">
        <a class="primary-action" :href="withBase('/guide/getting-started')">Open the guide <span>→</span></a>
        <a v-if="sourceUrl" class="secondary-action" :href="sourceUrl">View source</a>
      </div>
    </section>
  </main>
</template>
