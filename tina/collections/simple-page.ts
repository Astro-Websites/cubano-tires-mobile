import type { Collection } from 'tinacms';

// Generic page: a heading band plus free rich-text content. Use for pages that
// don't need a custom design (privacy, terms, job openings, announcements...).
export const SimplePageCollection: Collection = {
  name: 'simplePage',
  label: 'Simple Pages',
  path: 'src/content/simple-page',
  format: 'md',
  ui: {
    router: ({ document }) => `/${document._sys.relativePath.replace(/\.md$/, '')}/`,
    filename: {
      readonly: false,
      slugify: (values) => String(values?.title || 'untitled').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      description: 'The file name becomes the page URL: /<file-name>/. It must not match an existing page.',
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Page Name', isTitle: true, required: true },
    { type: 'string', name: 'seoTitle', label: 'SEO Title', description: 'Browser tab and Google title. Falls back to "<Page Name> | Cubano Tires Mobile Shop".' },
    { type: 'string', name: 'description', label: 'Meta Description', ui: { component: 'textarea' } },
    { type: 'string', name: 'heading', label: 'Heading', description: 'Big heading at the top. Falls back to the page name.' },
    { type: 'string', name: 'intro', label: 'Introduction', ui: { component: 'textarea' } },
    { type: 'image', name: 'image', label: 'Top Image (optional)' },
    { type: 'string', name: 'imageAlt', label: 'Top Image Alt Text (SEO)', description: 'Describe the image for Google and screen readers, e.g. "Technician replacing a semi truck tire in Anaheim".' },
    { type: 'rich-text', name: 'body', label: 'Content', isBody: true },
  ],
};
