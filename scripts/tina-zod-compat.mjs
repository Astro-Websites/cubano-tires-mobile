// Tina uses the Zod 3 API; the patched Zod 4 distribution ships that API at /v3.
// Keep Astro on the v4 entry point and explicitly select the legacy API for Tina.
import { readFile, writeFile } from 'node:fs/promises';
for (const path of [
  '@tinacms/cli/dist/index.js',
  '@tinacms/schema-tools/dist/index.js',
  '@tinacms/app/src/lib/graphql-reducer.ts',
  'tinacms/dist/index.js',
]) {
  const file = new URL(`../node_modules/${path}`, import.meta.url);
  const original = await readFile(file, 'utf8');
  const updated = original.replace(/(\bfrom\s*|\brequire\(\s*)(["'])zod\2/g, '$1$2zod/v3$2');
  if (updated !== original) await writeFile(file, updated);
}
