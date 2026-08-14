import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFile(file, 'utf8').then(JSON.parse);
const metadata = await read(path.join(site, '.api-metadata/index.json'));
const catalog = await read(path.join(site, 'i18n/api.zh-CN.json'));
const manifest = await read(path.join(site, 'src/data/operations.json'));
const generated = await read(path.join(site, 'src/data/operations.generated.json'));
const fail = (message) => { throw new Error(message); };
const cjk = (value) => /[\u3400-\u9fff]/u.test(value ?? '');
const placeholder = (value) => /Public KeyHold SDK declaration|Public Go SDK|is an exported Go constant|公共 API/u.test(value ?? '');
const slug = (value) => String(value).replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[_\s]+/g, '-').replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
for (const [input, expected] of [['ERROR_CODES', 'error-codes'], ['KeyHoldError', 'key-hold-error'], ['KDFParameters', 'kdf-parameters']]) if (slug(input) !== expected) fail(`Slug regression: ${input} -> ${slug(input)}, expected ${expected}`);
const expectedKeys = new Set();
for (const [sdk, data] of Object.entries(metadata)) for (const api of data.apis) {
  const key = `${sdk}.${api.kind}.${api.symbol}`; expectedKeys.add(key);
  const entry = catalog.api?.[key]; if (!entry || typeof entry.source !== 'string' || typeof entry.translation !== 'string' || !entry.translation.trim() || !cjk(entry.translation) || placeholder(entry.translation)) fail(`Missing/non-Chinese/placeholder translation catalog entry: ${key}`);
  if (entry.source !== api.summary) fail(`Stale translation catalog source for ${key}`);
  for (const p of api.parameters ?? []) { const k = `${key}.parameters.${p.name}`; expectedKeys.add(k); const e = catalog.api?.[k]; if (!e || e.source !== p.summary || !e.translation?.trim() || !cjk(e.translation) || placeholder(e.translation)) fail(`Missing/stale parameter translation: ${k}`); }
  for (const f of api.fields ?? []) { const k = `${key}.fields.${f.name}`; expectedKeys.add(k); const e = catalog.api?.[k]; if (!e || e.source !== f.summary || !e.translation?.trim() || !cjk(e.translation) || placeholder(e.translation)) fail(`Missing/stale field translation: ${k}`); }
  for (const m of api.methods ?? []) { const k = `${key}.methods.${m.name}`; expectedKeys.add(k); const e = catalog.api?.[k]; if (!e || e.source !== m.summary || !e.translation?.trim() || !cjk(e.translation) || placeholder(e.translation)) fail(`Missing/stale method translation: ${k}`); }
}
for (const key of Object.keys(catalog.api ?? {})) if (!expectedKeys.has(key)) fail(`Orphan translation catalog key: ${key}`);
const categories = new Set(manifest.map((o) => o.category));
for (const category of categories) if (!catalog.categories?.[category]?.trim() || !cjk(catalog.categories[category])) fail(`Missing/non-Chinese category translation: ${category}`);
if (generated.length !== manifest.length || generated.length !== 8) fail(`Expected 8 generated operations, got ${generated.length}`);
for (const op of manifest) {
  const output = generated.find((x) => x.id === op.id); if (!output) fail(`Missing generated operation: ${op.id}`);
  const labels = catalog.operations?.[op.id]; if (!labels?.source || !labels.translation?.title?.trim() || !labels.translation?.purpose?.trim() || !cjk(labels.translation.title) || !cjk(labels.translation.purpose) || placeholder(labels.translation.title) || placeholder(labels.translation.purpose)) fail(`Missing/non-Chinese/placeholder operation translation: ${op.id}`);
  if (JSON.stringify(labels.source) !== JSON.stringify({title: op.title, purpose: op.purpose})) fail(`Stale operation source: ${op.id}`);
  for (const [sdk, target] of Object.entries(op.sdks)) {
    const api = metadata[sdk].apis.find((x) => x.kind === target.kind && x.symbol === target.symbol); if (!api) fail(`Manifest target missing from metadata: ${sdk}.${target.kind}.${target.symbol}`);
    const contract = output.sdks[sdk]; if (!contract.symbol || !contract.input || !contract.output || !contract.href) fail(`Empty generated contract: ${op.id}/${sdk}`); const href = `/api/${sdk}/${api.kind}/${slug(api.symbol)}`;
    if (contract.href !== href) fail(`Generated href mismatch: ${op.id}/${sdk}`);
    if (contract.input !== (api.parameters ?? []).map((p) => `${p.name}: ${p.type}`).join(', ')) fail(`Generated input drift: ${op.id}/${sdk}`);
    if (contract.output !== (api.returns ?? '')) fail(`Generated output drift: ${op.id}/${sdk}`);
    const file = path.join(site, 'docs', 'api', sdk, api.kind, `${slug(api.symbol)}.md`); try { await fs.access(file); } catch { fail(`Operation href has no generated route: ${contract.href}`); }
  }
}
for (const [sdk, data] of Object.entries(metadata)) for (const api of data.apis) {
  const file = path.join(site, 'docs', 'api', sdk, api.kind, `${slug(api.symbol)}.md`);
  const content = await fs.readFile(file, 'utf8');
  if (!content.startsWith('---\n')) fail(`Generated API frontmatter is not first: ${sdk}.${api.kind}.${api.symbol}`);
  if (!content.includes(`slug: /api/${sdk}/${api.kind}/${slug(api.symbol)}\n`)) fail(`Generated API slug mismatch: ${sdk}.${api.kind}.${api.symbol}`);
  if (content.indexOf('title:') > content.indexOf('\n\n')) fail(`Generated API frontmatter leaked into body: ${sdk}.${api.kind}.${api.symbol}`);
}
const translatedDocs = ['guide/getting-started.md','guide/export-unlock.md','guide/validate-serialize.md','guide/errors.md','concepts/document-format.md','concepts/password-crypto.md','concepts/interoperability.md','concepts/security-model.md','operations.mdx','release-notes.md'];
for (const file of translatedDocs) { try { await fs.access(path.join(site, 'i18n/zh-CN/docusaurus-plugin-content-docs/current', file)); } catch { fail(`Missing zh-CN document translation: ${file}`); } }
for (const file of ['navbar.json','footer.json']) { const value = await read(path.join(site, 'i18n/zh-CN/docusaurus-theme-classic', file)); if (!Object.keys(value).length) fail(`Missing zh-CN UI translations: ${file}`); }
console.log(`i18n check passed: ${expectedKeys.size} qualified API entries, ${generated.length} operations, and ${translatedDocs.length} translated docs.`);
