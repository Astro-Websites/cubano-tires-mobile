// Homepage "Fresh From Our Instagram" grid.
//
// scripts/instagram-feed.mjs reads the Behold feed (Tina: Global Config > Instagram Feed)
// before each build, saves the photos to /instagram/ on our site and writes
// .cache/instagram.json. This file turns that list into the grid HTML.
// No saved posts means no grid: the section still shows its heading and Follow button.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type SavedPost = { id: string; image: string; width: number; height: number; permalink: string; mediaType?: string; caption?: string };

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => entities[char]);

// Short, readable alt text from the caption: first line, no emoji, hashtags or mentions, max ~120 characters.
export function altFromCaption(caption: string | undefined, handle: string) {
  const firstLine = (caption || '').split(/\n/).map((line) => line.trim()).find(Boolean) || '';
  let text = firstLine
    .replace(/[#@][\w.]+/g, '')
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}‍️]/gu, '')
    .replace(/\s+([!?.,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > 120) text = `${text.slice(0, 117).replace(/\s+\S*$/, '')}...`;
  return text || `Instagram post by @${handle}`;
}

const badge = (svg: string) =>
  `<span aria-hidden="true" style="position: absolute; top: 10px; right: 10px; display: flex; width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 999px; background: rgba(22,24,29,0.6); color: #FFFFFF">${svg}</span>`;
const playIcon = badge('<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>');
const albumIcon = badge('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>');

async function savedPosts(): Promise<SavedPost[]> {
  try {
    const data = JSON.parse(await readFile(path.join(process.cwd(), '.cache', 'instagram.json'), 'utf8'));
    return Array.isArray(data?.posts) ? data.posts : [];
  } catch {
    return [];
  }
}

export async function renderInstagramGrid(settings: { handle?: string } | undefined): Promise<string> {
  const handle = (settings?.handle || 'cubanotiresmobile').replace(/^@/, '');
  const tiles = (await savedPosts())
    .filter((post) => /^\/instagram\/[\w-]+\.webp$/.test(post.image) && /^https:\/\//.test(post.permalink))
    .map((post) => {
      const alt = altFromCaption(post.caption, handle);
      const icon = post.mediaType === 'VIDEO' ? playIcon : post.mediaType === 'CAROUSEL_ALBUM' ? albumIcon : '';
      return (
        `<a class="ig-tile" href="${escape(post.permalink)}" target="_blank" rel="noopener" aria-label="${escape(`View on Instagram: ${alt}`)}" style="position: relative; display: block; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; background: #16181D">` +
        `<img src="${escape(post.image)}" alt="${escape(alt)}" width="${post.width}" height="${post.height}" loading="lazy" decoding="async" style="display: block; width: 100%; height: 100%; object-fit: cover"/>` +
        `${icon}</a>`
      );
    });
  if (!tiles.length) return '';
  return `<div class="ig-grid" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px">${tiles.join('')}</div>`;
}
