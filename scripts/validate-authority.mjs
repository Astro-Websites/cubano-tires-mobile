import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packet = path.resolve(root, '..');
const source = await readFile(path.join(packet, 'demo', 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(packet, 'demo-manifest.json'), 'utf8'));
const digest = createHash('sha256').update(source).digest('hex');
if (digest !== manifest['index.html']?.sha256) throw new Error('ASTRO-DEMO-LOCK authority hash mismatch');

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

console.log(JSON.stringify({ gate: 'LOCAL_AUTHORITY_PREFLIGHT', status: 'PASS', digest, globalComponents: true, tinaCollections: ['globalConfig', 'navigation'] }));
