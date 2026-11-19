import type { Collection } from 'tinacms';

export const CategoryCollection: Collection = {
  name: 'category',
  label: 'Categories',
  path: 'src/content/category',
  format: 'json',
  fields: [
    { type: 'string', name: 'title', label: 'Category Name', isTitle: true, required: true },
    { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
  ],
};
