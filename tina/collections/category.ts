import type { Collection } from 'tinacms';

export const CategoryCollection: Collection = {
  name: 'category',
  label: 'Categories',
  path: 'src/content/category',
  format: 'json',
  ui: {
    filename: {
      readonly: false,
      slugify: (values) =>
        String(values?.title || 'category')
          .toLowerCase()
          .replace(/&/g, 'and')
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      description: 'The file name becomes the archive URL: /tire-tips/category/<file-name>/',
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Category Name', isTitle: true, required: true },
    { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
    {
      type: 'string',
      name: 'color',
      label: 'Label Color',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' },
        { value: 'green', label: 'Green' },
        { value: 'yellow', label: 'Yellow' },
        { value: 'gray', label: 'Gray' },
      ],
    },
  ],
};
