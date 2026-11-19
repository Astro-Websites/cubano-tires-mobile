import type { Collection } from 'tinacms';

export const PageCollection: Collection = {
  name: 'page',
  label: 'Pages',
  path: 'src/content/page',
  format: 'mdx',
  fields: [
    { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
    { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
    { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
  ],
};
