import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packet = path.resolve(root, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(path.join(packet, 'demo', 'index.html')).catch((err) => {
  if (err.code !== 'ENOENT') throw err;
  return null;
});
let digest = source ? hash(source) : 'pinned repository fragments (CI checkout)';
if (source) {
  const manifest = JSON.parse(await readFile(path.join(packet, 'demo-manifest.json'), 'utf8'));
  if (digest !== manifest['index.html']?.sha256) throw new Error('ASTRO-DEMO-LOCK authority hash mismatch');
}
const pins = {
  'src/fragments/body.html': '7162de27a1daeb715ecf33a5b4227c56f28b3df07681d4f1ef4c21f211469b26',
  'src/fragments/footer.html': '2a41e8daaff9bd74e444467b28e59237420c8e1da6e5b8bc69dadaa3bbdb5354',
  'src/fragments/header.html': '4d31760356054655dd823f438fdcec61afd32ff7d21043056a3723a777129265',
  'src/fragments/scripts.html': 'd871b8aca8f242e015eb321b4e46ebb6362e46d9a1b887471bf3c2f51a35db86',
  'src/styles/global.css': '5775ff08f7d3fa684ead0a77b601e4c8c2ff8d5906ed25685af11097ad5e657a',
};
for (const [file, expected] of Object.entries(pins)) {
  if (hash(await readFile(path.join(root, file))) !== expected) throw new Error(`Homepage authority changed: ${file}`);
}

const required = [
  ['src/fragments/header.html', ['<!-- Top bar -->', '<header', '</header>']],
  ['src/fragments/body.html', ['<!-- Hero -->', '<section id="top"', '<!-- Fleet logos -->']],
  ['src/fragments/footer.html', ['<!-- Footer -->', '<footer', '</footer>', 'cub-mbar']],
  ['src/fragments/scripts.html', ['data-tab', 'cub-tog', 'searchWidget.js']],
  ['src/styles/global.css', ['font-family:Montserrat', '@media (max-width: 760px)', '.cub-tog']],
];
for (const [file, needles] of required) {
  const value = await readFile(path.join(root, file), 'utf8');
  for (const needle of needles) if (!value.includes(needle)) throw new Error(`${file} missing ${needle}`);
}

const page = await readFile(path.join(root, 'src/pages/index.astro'), 'utf8');
if (!page.includes('<Header {config} {navigation} />') || !page.includes('<Footer {config} {navigation} />')) {
  throw new Error('Global header/footer are not route-wired components');
}
const tina = await readFile(path.join(root, 'tina/config.ts'), 'utf8');
for (const collection of ["name: 'globalConfig'", "name: 'navigation'"]) if (!tina.includes(collection)) throw new Error(`Missing Tina ${collection}`);
const modularCollections = [
  ['blog', 'Blogs', 'BlogCollection'],
  ['category', 'Categories', 'CategoryCollection'],
  ['page', 'Pages', 'PageCollection'],
  ['user', 'Users', 'UserCollection'],
];
for (const [name, label, symbol] of modularCollections) {
  if (!tina.includes(symbol)) throw new Error(`Tina config does not register ${symbol}`);
  const definition = await readFile(path.join(root, `tina/collections/${name}.ts`), 'utf8');
  if (!definition.includes(`name: '${name}'`) || !definition.includes(`label: '${label}'`)) {
    throw new Error(`Tina ${label} collection definition is incomplete`);
  }
}

console.log(JSON.stringify({ gate: 'LOCAL_AUTHORITY_PREFLIGHT', status: 'PASS', digest, globalComponents: true, tinaCollections: ['blog', 'category', 'page', 'user', 'globalConfig', 'navigation'] }));
