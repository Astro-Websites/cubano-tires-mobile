import { defineConfig } from 'tinacms';
import { BlogCollection } from './collections/blog';
import { CategoryCollection } from './collections/category';
import { PageCollection } from './collections/page';
import { SimplePageCollection } from './collections/simple-page';
import { UserCollection } from './collections/user';

const navigationItem = {
  type: 'object' as const,
  list: true,
  ui: { itemProps: (item: { label?: string }) => ({ label: item?.label }) },
  fields: [
    // Internal: the label this link had in the original design. Not needed for new items.
    { type: 'string' as const, name: 'sourceLabel', label: 'Original Label', ui: { component: 'hidden' } },
    { type: 'string' as const, name: 'label', label: 'Label', required: true },
    { type: 'string' as const, name: 'href', label: 'Link (URL)', required: true, description: 'A page path like /services/flat-tire-repair/, a homepage section like /#reviews, or a full https:// link.' },
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
      SimplePageCollection,
      UserCollection,
      {
        name: 'globalConfig',
        label: 'Global Config',
        path: 'src/content/global',
        match: { include: 'config' },
        format: 'json',
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: 'string', name: 'siteName', label: 'Site Name', required: true },
          {
            type: 'object',
            name: 'seo',
            label: 'Site Identity & SEO',
            fields: [
              { type: 'string', name: 'description', label: 'Default Meta Description', ui: { component: 'textarea' } },
              { type: 'image', name: 'logo', label: 'Logo' },
              { type: 'string', name: 'logoAlt', label: 'Logo Alt Text (SEO)', description: 'Used for the header logo, and the footer logo unless set below.' },
              { type: 'image', name: 'favicon', label: 'Favicon', description: 'Browser tab icon. Square SVG or PNG (at least 48x48).' },
              { type: 'image', name: 'appleTouchIcon', label: 'App Icon (phone home screen)', description: 'Square PNG, 180x180 or larger, no transparency. Used when someone saves the site to their phone.' },
              { type: 'image', name: 'footerLogo', label: 'Footer Logo', description: 'Upload the logo used in the footer. Falls back to the header logo when empty.' },
              { type: 'string', name: 'footerLogoAlt', label: 'Footer Logo Alt Text (SEO)' },
            ],
          },
          { type: 'string', name: 'announcement', label: 'Top Bar Announcement', description: 'Promo text in the black bar above the header. "Text or call <phone>" is added after it.' },
          {
            type: 'object',
            name: 'hours',
            label: 'Business Hours (footer)',
            fields: [
              { type: 'string', name: 'weekdayLabel', label: 'First Row Days' },
              { type: 'string', name: 'weekdayHours', label: 'First Row Hours' },
              { type: 'string', name: 'weekendLabel', label: 'Second Row Days' },
              { type: 'string', name: 'weekendHours', label: 'Second Row Hours' },
            ],
          },
          { type: 'string', name: 'phoneDisplay', label: 'Phone Display', required: true },
          { type: 'string', name: 'phoneDigits', label: 'Phone Digits', required: true },
          { type: 'string', name: 'addressLine1', label: 'Address Line 1', required: true },
          { type: 'string', name: 'addressLine2', label: 'Address Line 2', required: true },
          { type: 'string', name: 'copyright', label: 'Copyright', required: true },
          {
            type: 'object',
            name: 'blog',
            label: 'Blog Archive',
            description: 'Heading copy for the /tire-tips/ archive and category pages.',
            fields: [
              { type: 'string', name: 'eyebrow', label: 'Eyebrow' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'intro', label: 'Introduction', ui: { component: 'textarea' } },
            ],
          },
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
