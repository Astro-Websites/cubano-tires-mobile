import type { Collection } from 'tinacms';

export const BlogCollection: Collection = {
  name: 'blog',
  label: 'Blogs',
  path: 'src/content/blog',
  format: 'mdx',
  fields: [
    { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
    { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
    { type: 'datetime', name: 'pubDate', label: 'Publication Date' },
    { type: 'datetime', name: 'updatedDate', label: 'Updated Date' },
    {
      type: 'string',
      name: 'categories',
      label: 'Categories',
      list: true,
      description: 'Store one or more category document paths, for example src/content/category/services.json.',
    },
    {
      type: 'reference',
      name: 'author',
      label: 'Author / User',
      collections: ['user'],
    },
    { type: 'image', name: 'heroImage', label: 'Hero Image' },
    { type: 'string', name: 'heroImageAlt', label: 'Hero Image Alt Text' },
    { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
  ],
};
