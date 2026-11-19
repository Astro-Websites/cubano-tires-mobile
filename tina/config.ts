import { defineConfig } from 'tinacms';
import { BlogCollection } from './collections/blog';
import { CategoryCollection } from './collections/category';
import { PageCollection } from './collections/page';
import { UserCollection } from './collections/user';

const navigationItem = {
  type: 'object' as const,
  list: true,
  ui: { itemProps: (item: { label?: string }) => ({ label: item?.label }) },
  fields: [
    { type: 'string' as const, name: 'sourceLabel', label: 'Locked Source Label', required: true },
    { type: 'string' as const, name: 'label', label: 'Label', required: true },
    { type: 'string' as const, name: 'href', label: 'Link', required: true },
  ],
};

export default defineConfig({
  branch: process.env.GITHUB_BRANCH || process.env.HEAD || 'main',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '22563e32-05c5-4514-8047-827604848e9a',
  token: process.env.TINA_TOKEN || '',
  build: { outputFolder: 'admin', publicFolder: 'public' },
  media: { tina: { mediaRoot: 'uploads', publicFolder: 'public' } },
  schema: {
    collections: [
      BlogCollection,
      CategoryCollection,
      PageCollection,
      UserCollection,
      {
        name: 'globalConfig',
        label: 'Global Config',
        path: 'src/content/global',
        match: { include: 'config' },
        format: 'json',
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'siteName', label: 'Site Name', required: true },
          {
            type: 'object',
            name: 'seo',
            label: 'Site Identity & SEO',
            fields: [
              { type: 'string', name: 'description', label: 'Default Meta Description', ui: { component: 'textarea' } },
              { type: 'image', name: 'logo', label: 'Logo' },
              { type: 'image', name: 'favicon', label: 'Favicon', description: 'Upload the browser tab/site icon. Recommended: square PNG, SVG, or ICO.' },
              { type: 'image', name: 'footerLogo', label: 'Footer Logo', description: 'Upload the logo used in the footer. Falls back to the header logo when empty.' },
            ],
          },
          { type: 'string', name: 'phoneDisplay', label: 'Phone Display', required: true },
          { type: 'string', name: 'phoneDigits', label: 'Phone Digits', required: true },
          { type: 'string', name: 'addressLine1', label: 'Address Line 1', required: true },
          { type: 'string', name: 'addressLine2', label: 'Address Line 2', required: true },
          { type: 'string', name: 'copyright', label: 'Copyright', required: true },
          {
            type: 'object',
            name: 'codeInjection',
            label: 'Code Injection',
            fields: [
              { type: 'string', name: 'headerCode', label: 'Header Code', ui: { component: 'textarea' } },
              { type: 'string', name: 'footerCode', label: 'Footer Code', ui: { component: 'textarea' } },
            ],
          },
        ],
      },
      {
        name: 'navigation',
        label: 'Navigation',
        path: 'src/content/global',
        match: { include: 'navigation' },
        format: 'json',
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { ...navigationItem, name: 'header', label: 'Header Navigation' },
          { ...navigationItem, name: 'services', label: 'Footer Services' },
          { ...navigationItem, name: 'company', label: 'Footer Company' },
          { ...navigationItem, name: 'social', label: 'Social Links' },
          { ...navigationItem, name: 'legal', label: 'Legal Links' },
        ],
      },
    ],
  },
});
