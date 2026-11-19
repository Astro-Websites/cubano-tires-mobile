import type { Collection } from 'tinacms';

export const PageCollection: Collection = {
  name: 'page',
  label: 'Pages',
  path: 'src/content/page',
  format: 'md',
  ui: {
    filename: {
      readonly: false,
      slugify: (values) =>
        String(values?.title || 'untitled')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
    { type: 'string', name: 'description', label: 'Meta Description', required: true, ui: { component: 'textarea' } },
    {
      type: 'object',
      name: 'hero',
      label: 'Homepage Hero',
      fields: [
        { type: 'string', name: 'badge', label: 'Review Badge', required: true },
        { type: 'string', name: 'displayTitle', label: 'Display Title', required: true, ui: { component: 'textarea' } },
        { type: 'string', name: 'heading', label: 'Heading', required: true, ui: { component: 'textarea' } },
        { type: 'string', name: 'intro', label: 'Introduction', required: true, ui: { component: 'textarea' } },
        { type: 'string', name: 'primaryCtaLabel', label: 'Primary Button Label', required: true },
        { type: 'string', name: 'primaryCtaHref', label: 'Primary Button Link', required: true },
        { type: 'string', name: 'secondaryCtaLabel', label: 'Secondary Button Label', required: true },
        { type: 'string', name: 'secondaryCtaHref', label: 'Secondary Button Link', required: true },
      ],
    },
  ],
};
