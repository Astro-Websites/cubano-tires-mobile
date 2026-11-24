import type { TinaField } from 'tinacms';

// Extra fields for the /sitemap/ page. The page list itself is generated from the
// collections at build time; these only control the wording around it.
const sectionKeys = [
  { value: 'main', label: 'Main Pages' },
  { value: 'services', label: 'Tire Services (/services/...)' },
  { value: 'tires', label: 'Shop Tires (/tires/...)' },
  { value: 'vehicles', label: 'Vehicles (/vehicles/...)' },
  { value: 'areas', label: 'Areas (/areas/...)' },
  { value: 'about', label: 'About & Gallery' },
  { value: 'blog', label: 'Tire Tips (blog)' },
  { value: 'legal', label: 'Legal & Policies' },
];

export const sitemapFields: TinaField[] = [
  {
    type: 'boolean',
    name: 'hideFromSitemap',
    label: 'Hide from Sitemap',
    description: 'Turn on for pages visitors should not browse to, like the form Thank You page.',
  },
  {
    type: 'object',
    name: 'sitemap',
    label: 'Sitemap Page Settings',
    description: 'Only used on the Sitemap page. Every page, album and post is listed automatically.',
    fields: [
      {
        type: 'object',
        name: 'sections',
        label: 'Sitemap Sections',
        list: true,
        description: 'Change the heading or short description of a group. Leave a group out to use its default wording.',
        ui: { itemProps: (item: any) => ({ label: item?.heading || item?.key || 'Section' }) },
        fields: [
          { type: 'string', name: 'key', label: 'Group', options: sectionKeys, required: true },
          { type: 'string', name: 'heading', label: 'Heading' },
          { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
        ],
      },
      {
        type: 'object',
        name: 'cta',
        label: 'Bottom Call to Action',
        fields: [
          { type: 'string', name: 'heading', label: 'Heading' },
          { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
          {
            type: 'object',
            name: 'button',
            label: 'Button',
            fields: [
              { type: 'string', name: 'label', label: 'Label' },
              { type: 'string', name: 'href', label: 'Link URL' },
              { type: 'boolean', name: 'newTab', label: 'Open in new tab' },
            ],
          },
        ],
      },
    ],
  },
];
