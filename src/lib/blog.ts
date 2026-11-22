import { getCollection, type CollectionEntry } from 'astro:content';

export type Category = { slug: string; title: string; description?: string; color: string };
export type Author = { name: string; role?: string; avatar?: string; bio?: string };
export type Post = {
  entry: CollectionEntry<'blog'>;
  slug: string;
  url: string;
  title: string;
  seoTitle: string;
  description: string;
  date?: Date;
  updated?: Date;
  featured: boolean;
  categories: Category[];
  author?: Author;
  readTime: string;
  heroImage: string;
  heroImageAlt: string;
  data: Record<string, any>;
};

export const DEFAULT_IMAGE = '/uploads/cubano-pages/cubano-tires-technician-at-the-branded-service.jpg';

export const pillColors: Record<string, { bg: string; fg: string }> = {
  red: { bg: '#FFF1F0', fg: '#B3241F' },
  blue: { bg: '#E8EEFB', fg: '#1D3E8A' },
  green: { bg: '#EEF7EF', fg: '#1E7B34' },
  yellow: { bg: '#FFF4D6', fg: '#7A4B00' },
  gray: { bg: '#ECEDEF', fg: '#16181D' },
};
export const pill = (color?: string) => pillColors[color || ''] || pillColors.blue;

const fileSlug = (path: unknown) =>
  String(path || '').split('/').pop()?.replace(/\.(json|md|mdx)$/, '').toLowerCase() || '';

const toDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const formatDate = (date?: Date) =>
  date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

export const initial = (name?: string) => (name || 'C').trim().charAt(0).toUpperCase();

export async function getCategories(): Promise<Category[]> {
  return (await getCollection('category')).map((entry) => ({
    slug: entry.id.toLowerCase(),
    title: String(entry.data.title || entry.id),
    description: entry.data.description as string | undefined,
    color: String(entry.data.color || 'blue'),
  }));
}

export async function getPosts(): Promise<Post[]> {
  const [entries, categories, users] = await Promise.all([getCollection('blog'), getCategories(), getCollection('user')]);
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const userMap = new Map(users.map((user) => [user.id.toLowerCase(), user.data as Author]));
  return entries
    .map((entry) => {
      const data = entry.data as Record<string, any>;
      const words = String(entry.body || '').split(/\s+/).filter(Boolean).length
        + (data.faqs || []).reduce((sum: number, faq: any) => sum + `${faq?.question || ''} ${faq?.answer || ''}`.split(/\s+/).length, 0);
      const slug = entry.id.toLowerCase();
      const rawCategories: unknown[] = Array.isArray(data.categories) ? data.categories : [];
      return {
        entry,
        slug,
        url: `/blog/${slug}/`,
        title: String(data.title || slug),
        seoTitle: String(data.seoTitle || data.title || slug),
        description: String(data.description || ''),
        date: toDate(data.pubDate),
        updated: toDate(data.updatedDate),
        featured: Boolean(data.featured),
        categories: rawCategories
          .map((item) => categoryMap.get(fileSlug(typeof item === 'string' ? item : (item as any)?.category)))
          .filter((category): category is Category => Boolean(category)),
        author: userMap.get(fileSlug(data.author)),
        readTime: `${Math.max(1, Math.round(words / 200))} min read`,
        heroImage: String(data.heroImage || DEFAULT_IMAGE),
        heroImageAlt: String(data.heroImageAlt || ''),
        data,
      } satisfies Post;
    })
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0) || a.title.localeCompare(b.title));
}

export const postMeta = (post: Post) =>
  [post.author?.name, post.readTime, formatDate(post.date)].filter(Boolean).join(' · ');
