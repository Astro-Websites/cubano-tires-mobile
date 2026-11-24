// Every public page on the site, read from the Tina collections at build time.
// The /sitemap/ page groups these by URL, so adding, renaming or deleting a page,
// album or post in Tina updates the sitemap on the next build. Nothing is typed by hand.
import { getCollection } from 'astro:content';
import { getCategories, getPosts } from './blog';
import navigation from '../content/global/navigation.json';
import { SECTION_COLLECTIONS, sectionSlug, type SectionCollection } from './page-collections';

// topic: a blog post's first category, used to group posts on the sitemap.
export type SitePage = { url: string; title: string; kind: 'page' | 'post' | 'category'; children: SitePage[]; topic?: { title: string; url: string } };
export type SitemapSectionKey = 'main' | 'services' | 'tires' | 'vehicles' | 'areas' | 'about' | 'blog' | 'legal';
export type SitemapSection = {
  key: SitemapSectionKey;
  heading: string;
  description: string;
  hub?: SitePage;
  pages: SitePage[];
  categories: SitePage[];
  count: number;
};

type Data = Record<string, any>;
// The form Thank You page is never listed (it is only reached after sending the Contact form).
const hidden = (data: Data) => Boolean(data.hideFromSitemap || data.draft || data.noindex || data.demoTemplate === 'thank-you');
const label = (data: Data, fallback: string) => String(data.title || fallback).trim();

// Default wording for each group. Editors can override heading and description in
// Tina: Simple Pages → Sitemap → Sitemap Sections.
export const SECTION_DEFAULTS: Record<SitemapSectionKey, { heading: string; description: string }> = {
  main: { heading: 'Main Pages', description: 'Start here: our homepage, deals, answers and how to reach us.' },
  services: { heading: 'Tire Services', description: 'Mobile tire work done at your home, office, jobsite or the roadside.' },
  tires: { heading: 'Shop Tires', description: 'Search tires online and browse tires for trailers, RVs and equipment.' },
  vehicles: { heading: 'Vehicles', description: 'Tire service for the vehicles that need a little extra know-how.' },
  areas: { heading: 'Areas We Serve', description: 'Cities where our mobile tire trucks come to you.' },
  about: { heading: 'About Cubano', description: 'Who we are, what customers say and photos of our work.' },
  blog: { heading: 'Tire Tips', description: 'Straight answers and guides from the techs who do the work.' },
  legal: { heading: 'Legal & Policies', description: 'Privacy, terms and how we keep the site accessible.' },
};
export const SECTION_ORDER: SitemapSectionKey[] = ['main', 'services', 'tires', 'vehicles', 'areas', 'about', 'blog', 'legal'];

const legalUrls = new Set([...(navigation.legal || []).map((item: { href?: string }) => item.href || ''), '/sitemap/']);
// Navigation order (header, footer columns) decides the order inside each group.
const navOrder = new Map<string, number>();
for (const item of Object.values(navigation).flat() as { href?: string }[]) {
  if (item?.href && !navOrder.has(item.href)) navOrder.set(item.href, navOrder.size);
}

function sectionOf(url: string): { key: SitemapSectionKey; hubUrl?: string } {
  if (url.startsWith('/services/')) return { key: 'services', hubUrl: '/services/' };
  if (url.startsWith('/tires/')) return { key: 'tires', hubUrl: '/tires/' };
  if (url.startsWith('/vehicles/')) return { key: 'vehicles', hubUrl: '/vehicles/' };
  if (url.startsWith('/areas/')) return { key: 'areas', hubUrl: '/areas/' };
  if (url.startsWith('/tire-tips/')) return { key: 'blog', hubUrl: '/tire-tips/' };
  if (url === '/about-us/' || url.startsWith('/about/')) return { key: 'about' };
  if (legalUrls.has(url)) return { key: 'legal' };
  return { key: 'main' };
}

async function safeCollection(name: string): Promise<{ id: string; data: Data }[]> {
  try {
    return (await getCollection(name as any)) as any;
  } catch {
    return [];
  }
}

export async function getSitePages(): Promise<SitePage[]> {
  const pages: SitePage[] = [];
  const add = (url: string, title: string, kind: SitePage['kind'] = 'page') => pages.push({ url, title, kind, children: [] });

  // Tina: Pages (designed and simple pages).
  for (const { id, data } of await safeCollection('page')) {
    if (hidden(data)) continue;
    if (id === 'homepage') add('/', 'Home');
    else add(`/${id}/`, label(data, id));
  }
  // Tina: Areas, Services, Tires, Vehicles and Gallery (one URL folder each).
  for (const name of Object.keys(SECTION_COLLECTIONS) as SectionCollection[]) {
    for (const { id, data } of await safeCollection(name)) {
      if (!data.demoTemplate || hidden(data)) continue;
      add(`/${sectionSlug(name, id)}/`, label(data, id));
    }
  }

  const posts = (await getPosts()).filter((post) => !hidden(post.data));
  if (posts.length) add('/tire-tips/', 'Tire Tips');
  for (const post of posts) {
    add(post.url, post.title, 'post');
    const first = post.categories[0];
    if (first) pages[pages.length - 1].topic = { title: first.title, url: `/tire-tips/category/${first.slug}/` };
  }
  const used = new Set(posts.flatMap((post) => post.categories.map((category) => category.slug)));
  for (const category of (await getCategories()).filter((c) => used.has(c.slug))) {
    add(`/tire-tips/category/${category.slug}/`, category.title, 'category');
  }
  return pages;
}

const rank = (page: SitePage) => navOrder.get(page.url) ?? Number.MAX_SAFE_INTEGER;
const byNav = (a: SitePage, b: SitePage) => (a.url === '/' ? -1 : b.url === '/' ? 1 : rank(a) - rank(b) || a.title.localeCompare(b.title));

// Nest a page under the closest page whose URL contains it (albums under Gallery).
function nest(list: SitePage[]): SitePage[] {
  const roots: SitePage[] = [];
  const sorted = [...list].sort((a, b) => a.url.length - b.url.length);
  for (const page of sorted) {
    const parent = sorted
      .filter((other) => other !== page && other.url !== '/' && other.url.length < page.url.length && page.url.startsWith(other.url))
      .sort((a, b) => b.url.length - a.url.length)[0];
    (parent ? parent.children : roots).push(page);
  }
  const sortTree = (items: SitePage[]) => {
    items.sort(byNav);
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

export async function getSitemapSections(
  overrides: { key?: string; heading?: string; description?: string }[] = [],
): Promise<SitemapSection[]> {
  const pages = await getSitePages();
  const buckets = new Map<SitemapSectionKey, { hub?: SitePage; pages: SitePage[]; categories: SitePage[] }>();
  for (const page of pages) {
    const { key, hubUrl } = sectionOf(page.url);
    const bucket = buckets.get(key) || { pages: [], categories: [] };
    buckets.set(key, bucket);
    if (page.url === hubUrl) bucket.hub = page;
    else if (page.kind === 'category') bucket.categories.push(page);
    else bucket.pages.push(page);
  }
  const custom = new Map(overrides.filter((o) => o?.key).map((o) => [o.key as SitemapSectionKey, o]));
  return SECTION_ORDER.filter((key) => buckets.has(key)).map((key) => {
    const bucket = buckets.get(key)!;
    const tree = key === 'blog' ? [...bucket.pages] : nest(bucket.pages);
    const count = bucket.pages.length + (bucket.hub ? 1 : 0);
    return {
      key,
      heading: custom.get(key)?.heading || SECTION_DEFAULTS[key].heading,
      description: custom.get(key)?.description ?? SECTION_DEFAULTS[key].description,
      hub: bucket.hub,
      pages: tree,
      categories: bucket.categories.sort((a, b) => a.title.localeCompare(b.title)),
      count,
    };
  });
}
