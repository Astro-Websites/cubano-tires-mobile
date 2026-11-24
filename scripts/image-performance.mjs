// Astro integration: page-speed attributes on every <img> in the built site.
//
// Runs after `astro build` on the final HTML in dist/, so it covers every image
// no matter where it comes from: Tina page fields, gallery albums, blog bodies,
// Users avatars, components and the HTML fragments. Editors never have to set
// anything in Tina for this.
//
// Per page:
//   - Header logo: left as is (loads right away).
//   - Hero image (the first large, visible image in the page's hero section, the
//     one holding the <h1>; pages whose hero has no photo get none): kept eager
//     with fetchpriority="high", because lazy-loading the main above-the-fold
//     image slows Largest Contentful Paint.
//   - Every other image: loading="lazy" and decoding="async".
//   - width/height from the real file in public/ when the tag has none and its
//     inline style already sets a width, so the browser reserves the space
//     before the photo arrives (less layout shift) without changing the layout.
//     navigation.css has the matching `:where(img[width][height]) { height: auto }`.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const SMALL_PX = 120; // icons, badges and avatars at or below this size are never the hero

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>])`, 'i'));
  if (!m) return undefined;
  return m[2] ?? m[3] ?? m[4] ?? '';
};
const removeAttr = (tag, name) =>
  tag.replace(new RegExp(`\\s${name}(?:\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+))?(?=[\\s/>])`, 'gi'), '');
const addAttrs = (tag, attrs) => {
  const text = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
  return tag.replace(/\s*(\/?)>$/, (_, slash) => `${text}${slash ? '/' : ''}>`);
};
const styleOf = (tag) => (attr(tag, 'style') || '').toLowerCase();
const cssPx = (style, prop) => {
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([\\d.]+)px`));
  return m ? Number(m[1]) : undefined;
};
const setsWidth = (style) => /(?:^|;)\s*width\s*:/.test(style);

function isSmall(tag) {
  const style = styleOf(tag);
  const w = cssPx(style, 'width') ?? (Number(attr(tag, 'width')) || undefined);
  const h = cssPx(style, 'height') ?? cssPx(style, 'max-height');
  return (w !== undefined && w <= SMALL_PX) || (h !== undefined && h <= SMALL_PX);
}

export default function imagePerformance() {
  let publicDir;
  const sizes = new Map();

  async function sizeOf(src) {
    if (!src || !src.startsWith('/') || src.startsWith('//')) return undefined;
    const clean = decodeURIComponent(src.split(/[?#]/)[0]);
    if (!sizes.has(clean)) {
      sizes.set(
        clean,
        sharp(path.join(publicDir, clean))
          .metadata()
          .then((m) => (m.width && m.height ? { width: m.width, height: m.height } : undefined))
          .catch(() => undefined),
      );
    }
    return sizes.get(clean);
  }

  return {
    name: 'cubano-image-performance',
    hooks: {
      'astro:config:done': ({ config }) => {
        publicDir = fileURLToPath(config.publicDir);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        let lazy = 0;
        let heroes = 0;
        let sized = 0;
        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          // Leave <script>, <template>, <noscript> and <style> content alone.
          const parts = html.split(/(<(script|template|noscript|style)\b[\s\S]*?<\/\2>)/i);
          const headerEnd = html.search(/<\/header>/i);
          // The hero must sit in the page's hero section (the <section> holding the
          // <h1>, or the first section of <main>), never further down or in the footer.
          const footerStart = html.search(/<footer\b/i);
          const mainStart = html.search(/<main\b/i);
          const h1 = html.search(/<h1\b/i);
          const sections = [...html.matchAll(/<section\b/gi)].map((s) => s.index).filter((s) => s > mainStart);
          const heroSectionEnd = sections.find((s) => s > Math.max(h1, sections[0] ?? 0));
          const heroLimit = Math.min(
            footerStart === -1 ? html.length : footerStart,
            heroSectionEnd ?? html.length,
          );
          let offset = 0;
          let heroDone = false;
          const out = [];
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i % 3 === 2) continue; // captured tag name from the split
            if (i % 3 === 1) {
              out.push(part);
              offset += part.length;
              continue;
            }
            const base = offset;
            const pieces = [];
            let last = 0;
            for (const m of part.matchAll(/<img\b[^>]*>/gi)) {
              pieces.push(part.slice(last, m.index));
              last = m.index + m[0].length;
              let tag = m[0];
              const at = base + m.index;
              const src = attr(tag, 'src');
              const inHeader = headerEnd !== -1 && at < headerEnd;
              if (inHeader || !src || src.startsWith('data:')) {
                pieces.push(tag);
                continue;
              }
              if (!attr(tag, 'width') && !attr(tag, 'height') && setsWidth(styleOf(tag))) {
                const size = await sizeOf(src);
                if (size) {
                  tag = addAttrs(tag, size);
                  sized++;
                }
              }
              const hidden = attr(tag, 'hidden') !== undefined || /display\s*:\s*none/.test(styleOf(tag));
              tag = removeAttr(removeAttr(removeAttr(tag, 'loading'), 'decoding'), 'fetchpriority');
              if (!heroDone && at < heroLimit && !hidden && !isSmall(tag)) {
                heroDone = true;
                heroes++;
                tag = addAttrs(tag, { loading: 'eager', decoding: 'async', fetchpriority: 'high' });
              } else {
                lazy++;
                tag = addAttrs(tag, { loading: 'lazy', decoding: 'async' });
              }
              pieces.push(tag);
            }
            pieces.push(part.slice(last));
            out.push(pieces.join(''));
            offset += part.length;
          }
          const next = out.join('');
          if (next !== html) await writeFile(file, next);
        }
        logger.info(`${lazy} images lazy-loaded, ${heroes} hero images kept eager, ${sized} given width/height`);
      },
    },
  };
}
