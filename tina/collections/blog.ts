import type { Collection } from 'tinacms';

const slugify = (value: unknown) =>
  String(value || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const BlogCollection: Collection = {
  name: 'blog',
  label: 'Blogs',
  path: 'src/content/blog',
  format: 'md',
  ui: {
    router: ({ document }) => `/tire-tips/${document._sys.filename.toLowerCase()}/`,
    filename: {
      readonly: false,
      slugify: (values) => slugify(values?.title),
      description: 'The file name becomes the post URL: /tire-tips/<file-name>/',
    },
  },
  defaultItem: () => ({ pubDate: new Date().toISOString() }),
  fields: [
    { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
    {
      type: 'string',
      name: 'seoTitle',
      label: 'SEO Title',
      description: 'Browser tab and search result title. Falls back to the post title.',
    },
    {
      type: 'string',
      name: 'description',
      label: 'Description',
      description: 'Meta description and the summary shown on blog cards.',
      ui: { component: 'textarea' },
    },
    { type: 'datetime', name: 'pubDate', label: 'Publication Date' },
    { type: 'datetime', name: 'updatedDate', label: 'Updated Date' },
    {
      type: 'boolean',
      name: 'featured',
      label: 'Feature on Blog Archive',
      description: 'Show this post in the large featured slot at the top of /tire-tips/. The newest featured post wins.',
    },
    {
      type: 'object',
      name: 'categories',
      label: 'Categories',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.category?.split('/').pop()?.replace(/\.json$/, '') || 'Category' }) },
      fields: [{ type: 'reference', name: 'category', label: 'Category', collections: ['category'] }],
    },
    {
      type: 'reference',
      name: 'author',
      label: 'Author / User',
      collections: ['user'],
    },
    { type: 'string', name: 'reviewedBy', label: 'Reviewed By' },
    { type: 'image', name: 'heroImage', label: 'Hero Image' },
    { type: 'string', name: 'heroImageAlt', label: 'Hero Image Alt Text (SEO)', description: 'Describe the image for Google and screen readers, e.g. "Technician replacing a semi truck tire in Anaheim".' },
    {
      type: 'string',
      name: 'quickAnswer',
      label: 'Quick Answer',
      description: 'Short answer shown in the green box above the article.',
      ui: { component: 'textarea' },
    },
    { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
    {
      type: 'object',
      name: 'faqs',
      label: 'FAQ',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.question }) },
      fields: [
        { type: 'string', name: 'question', label: 'Question' },
        { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'relatedService',
      label: 'Related Service',
      fields: [
        { type: 'string', name: 'label', label: 'Label' },
        { type: 'string', name: 'url', label: 'Link' },
      ],
    },
  ],
};
