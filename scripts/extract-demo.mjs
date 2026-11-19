import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const projectPacket = path.resolve(root, '..');
const sourcePath = path.join(projectPacket, 'demo', 'index.html');
const manifestPath = path.join(projectPacket, 'demo-manifest.json');
const source = await readFile(sourcePath, 'utf8');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const digest = createHash('sha256').update(source).digest('hex');

if (digest !== manifest['index.html']?.sha256) {
  throw new Error(`Demo authority hash mismatch: ${digest}`);
}

const between = (start, end, includeEnd = false) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`Missing demo boundary: ${start} -> ${end}`);
  return source.slice(from, to + (includeEnd ? end.length : 0)).trim();
};

const styles = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1].trim()).join('\n');
const header = between('<!-- Top bar -->', '</header>', true);
const body = between('<!-- Hero -->', '<!-- Footer -->');
const footer = between('<!-- Footer -->', '</footer>', true) + '\n\n' + between('<!-- Sticky mobile action bar -->', '</div>', true);
const scripts = source.slice(source.indexOf('<script>', source.indexOf('</div>\n<script>', source.indexOf('<!-- Sticky mobile action bar -->'))), source.lastIndexOf('</body>')).trim();

await mkdir(path.join(root, 'src', 'fragments'), { recursive: true });
await mkdir(path.join(root, 'src', 'styles'), { recursive: true });
await writeFile(path.join(root, 'src', 'fragments', 'header.html'), `${header}\n`);
await writeFile(path.join(root, 'src', 'fragments', 'body.html'), `${body}\n`);
await writeFile(path.join(root, 'src', 'fragments', 'footer.html'), `${footer}\n`);
await writeFile(path.join(root, 'src', 'fragments', 'scripts.html'), `${scripts}\n`);
await writeFile(path.join(root, 'src', 'styles', 'global.css'), `${styles}\n`);
console.log(JSON.stringify({ status: 'PASS', digest, fragments: ['header', 'body', 'footer', 'scripts', 'styles'] }));
