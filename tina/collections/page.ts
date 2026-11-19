import type { Collection } from 'tinacms';

export const PageCollection: Collection = {
  name: 'page',
  label: 'Pages',
  path: 'src/content/page',
  format: 'md',
  ui: {
    router: ({ document }) => document._sys.filename === 'homepage' ? '/' : `/${document._sys.relativePath.replace(/\.md$/, '')}/`,
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
    { type: 'string', name: 'demoTemplate', label: 'Layout', ui: { component: 'hidden' } },
    {
      type: 'object', name: 'demoSections', label: 'Page Sections', list: true,
      ui: { itemProps: (item) => ({ label: item?.label }) },
      fields: [
        { type: 'string', name: 'label', label: 'Section Label' },
        { type: 'object', name: 'copy', label: 'Text', list: true, ui: { itemProps: (item) => ({ label: item?.text?.slice(0, 75) }) }, fields: [
          { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        ] },
        { type: 'object', name: 'links', label: 'Links', list: true, ui: { itemProps: (item) => ({ label: item?.label }) }, fields: [
          { type: 'string', name: 'label', label: 'Editor Label' }, { type: 'string', name: 'url', label: 'Link Destination' },
        ] },
        { type: 'object', name: 'images', label: 'Images', list: true, ui: { itemProps: (item) => ({ label: item?.alt }) }, fields: [
          { type: 'image', name: 'source', label: 'Image' }, { type: 'string', name: 'alt', label: 'Alternative Text' },
        ] },
      ],
    },
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
