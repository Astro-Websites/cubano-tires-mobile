import { defineConfig } from 'astro/config';
import { writeFile } from 'node:fs/promises';
import imagePerformance from './scripts/image-performance.mjs';

const site = 'https://staging.cubano.blissdrive.net';

// Writes dist/sitemap.xml from the built pages (no extra dependency).
const sitemap = {
  name: 'cubano-sitemap',
  hooks: {
    'astro:build:done': async ({ dir, pages }) => {
      const urls = pages
        .map(({ pathname }) => `/${pathname}`.replace(/\/+$/, '/') )
        .filter((path) => !/^\/(404|500|thank-you)\/?$/.test(path) && !path.startsWith('/admin'))
        .sort()
        .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
      await writeFile(new URL('sitemap.xml', dir), xml);
    },
  },
};

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap, imagePerformance()],
});
