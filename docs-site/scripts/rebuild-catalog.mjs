import fs from 'node:fs/promises';
import path from 'node:path';
const site = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const old = JSON.parse(await fs.readFile(path.join(site, 'i18n/api.zh-CN.json'), 'utf8'));
const meta = JSON.parse(await fs.readFile(path.join(site, '.api-metadata/index.json'), 'utf8'));
const api = {};
for (const [sdk, data] of Object.entries(meta)) for (const item of data.apis) {
  const key = `${sdk}.${item.kind}.${item.symbol}`;
  const members = [
    ...(item.parameters ?? []).map((x) => [`${key}.parameters.${x.name}`, x.summary]),
    ...(item.fields ?? []).map((x) => [`${key}.fields.${x.name}`, x.summary]),
    ...(item.methods ?? []).map((x) => [`${key}.methods.${x.name}`, x.summary]),
  ];
  const entries = [[key, item.summary], ...members];
  for (const [entryKey, source] of entries) {
    const prior = old.api?.[entryKey];
    api[entryKey] = {source, translation: prior?.source === source ? prior.translation : ''};
  }
}
const operationSource = JSON.parse(await fs.readFile(path.join(site, 'src/data/operations.json'), 'utf8'));
const categories = Object.fromEntries([...new Set(operationSource.map((o) => o.category))].map((category) => [category, old.categories?.[category] ?? '']));
const operations = Object.fromEntries(operationSource.map((o) => { const prior = old.operations?.[o.id]; const source = {title: o.title, purpose: o.purpose}; return [o.id, {source, translation: prior?.source && JSON.stringify(prior.source) === JSON.stringify(source) ? prior.translation : {title: '', purpose: ''}}]; }));
await fs.writeFile(path.join(site, 'i18n/api.zh-CN.json'), JSON.stringify({api, categories, operations}, null, 2) + '\n');
