import { defineConfig } from 'tinacms';

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
      {
        name: 'globalConfig',
        label: 'Global Config',
        path: 'src/content/global',
        match: { include: 'config' },
        format: 'json',
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'siteName', label: 'Site Name', required: true },
          { type: 'string', name: 'phoneDisplay', label: 'Phone Display', required: true },
          { type: 'string', name: 'phoneDigits', label: 'Phone Digits', required: true },
          { type: 'string', name: 'addressLine1', label: 'Address Line 1', required: true },
          { type: 'string', name: 'addressLine2', label: 'Address Line 2', required: true },
          { type: 'string', name: 'copyright', label: 'Copyright', required: true },
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
