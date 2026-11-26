// Astro integration: saves the latest Instagram posts for the homepage
// "Fresh From Our Instagram" grid onto our own site.
//
// Before every build (and when `astro dev` starts) it reads the Behold JSON feed
// set in Tina (Global Config > Instagram Feed), downloads each post's photo, crops
// it to a 480x480 WebP in public/instagram/, and writes .cache/instagram.json for
// src/lib/instagram.ts to render. Visitors load the photos from our site, never
// from Instagram or Behold, and Behold's monthly view limit is never used.
//
// It never fails the build: if the feed or a photo can't be fetched, that post (or
// the whole grid) is left out and the section keeps its heading and Follow button.
// New posts appear on the next rebuild.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TILE_PX = 480;
const isHttps = (value) => typeof value === 'string' && /^https:\/\//i.test(value);

async function fetchWithTimeout(url, ms) {
  const response = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
  return response;
}

export async function syncInstagram(root, logger = console) {
  const outDir = path.join(root, 'public', 'instagram');
  const manifestPath = path.join(root, '.cache', 'instagram.json');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const save = (posts) => writeFile(manifestPath, JSON.stringify({ fetchedAt: new Date().toISOString(), posts }, null, 2));

  const config = JSON.parse(await readFile(path.join(root, 'src', 'content', 'global', 'config.json'), 'utf8'));
  const settings = config.instagram || {};
  const feedUrl = String(settings.feedUrl || '').trim();
  const limit = Math.max(1, Math.min(Number(settings.postCount) || 6, 12));
  if (!isHttps(feedUrl)) {
    logger.info('No Behold feed URL in Global Config, so the homepage Instagram grid is hidden.');
    return save([]);
  }

  let feed;
  try {
    feed = await (await fetchWithTimeout(feedUrl, 15000)).json();
  } catch (error) {
    logger.warn(`Could not read the Behold feed (${error.message}), so the homepage Instagram grid is hidden this build.`);
    return save([]);
  }

  const posts = [];
  for (const post of Array.isArray(feed?.posts) ? feed.posts : []) {
    if (posts.length >= limit) break;
    const size = post?.sizes?.medium || post?.sizes?.large || post?.sizes?.small;
    const id = String(post?.id || '').replace(/[^\w-]/g, '');
    if (!id || !isHttps(post?.permalink) || !isHttps(size?.mediaUrl)) continue;
    try {
      const source = Buffer.from(await (await fetchWithTimeout(size.mediaUrl, 20000)).arrayBuffer());
      await sharp(source).resize(TILE_PX, TILE_PX, { fit: 'cover' }).webp({ quality: 75 }).toFile(path.join(outDir, `${id}.webp`));
      posts.push({
        id,
        image: `/instagram/${id}.webp`,
        width: TILE_PX,
        height: TILE_PX,
        permalink: post.permalink,
        mediaType: post.mediaType,
        caption: post.altText || post.prunedCaption || post.caption || '',
        timestamp: post.timestamp,
      });
    } catch (error) {
      logger.warn(`Skipped Instagram post ${id}: ${error.message}`);
    }
  }
  logger.info(`Saved ${posts.length} Instagram post${posts.length === 1 ? '' : 's'} for the homepage grid.`);
  return save(posts);
}

export default function instagramFeed() {
  return {
    name: 'cubano-instagram-feed',
    hooks: {
      'astro:config:setup': async ({ command, config, logger }) => {
        if (command !== 'build' && command !== 'dev') return;
        await syncInstagram(new URL(config.root).pathname, logger);
      },
    },
  };
}
