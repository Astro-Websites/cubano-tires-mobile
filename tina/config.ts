import { defineConfig } from 'tinacms';
import { BlogCollection } from './collections/blog';
import { CategoryCollection } from './collections/category';
import { GalleryCollection } from './collections/gallery';
import { PageCollection, sectionCollection } from './collections/page';
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
      sectionCollection('areas'),
      sectionCollection('services'),
      sectionCollection('tires'),
      sectionCollection('vehicles'),
      GalleryCollection,
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
          { type: 'string', name: 'email', label: 'Email', description: 'Shown on the Contact page. Type {{email}} in any page text to insert it.' },
          { type: 'string', name: 'formEmail', label: 'Contact Form Email', description: 'Where Contact page form messages are sent. The first message to a new address sends a one time activation email from FormSubmit to that address: click it to start getting messages. Type {{formEmail}} to insert it.' },
          { type: 'string', name: 'turnstileSiteKey', label: 'Contact Form Bot Check Site Key', description: 'Cloudflare Turnstile site key (Cloudflare dashboard, Turnstile, add the site domains). Leave empty to hide the check.' },
          { type: 'string', name: 'addressLine1', label: 'Address Line 1', required: true, description: 'The Contact page map searches Google for the Site Name plus this address (token {{mapQuery}}), so the pin shows the Google Business listing name. Keep both matching the Google Business Profile.' },
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
          {
            ...navigationItem,
            name: 'header',
            label: 'Header Navigation',
            fields: [
              ...navigationItem.fields,
              {
                ...navigationItem,
                name: 'children',
                label: 'Dropdown Links',
                description: 'Optional. Links shown in a dropdown under this menu item. Leave empty for a plain link.',
                fields: navigationItem.fields.filter((field) => field.name !== 'sourceLabel'),
              },
            ],
          },
          {
            type: 'object',
            list: true,
            name: 'footerColumns',
            label: 'Footer Link Columns',
            description: 'Each column is a heading with its own list of links. Add, remove or reorder columns and links here.',
            ui: { itemProps: (item: { heading?: string; hidden?: boolean }) => ({ label: `${item?.heading || ''}${item?.hidden ? ' (hidden)' : ''}` }) },
            fields: [
              { type: 'string', name: 'heading', label: 'Column Heading', required: true },
              { type: 'boolean', name: 'hidden', label: 'Hide this column', description: 'Keep the column here but don\'t show it in the footer.' },
              { ...navigationItem, name: 'links', label: 'Links', fields: navigationItem.fields.filter((field) => field.name !== 'sourceLabel') },
            ],
          },
          { ...navigationItem, name: 'social', label: 'Social Links', description: 'Shown in the top bar and as the "Follow Us" footer column.' },
          { ...navigationItem, name: 'legal', label: 'Legal Links' },
        ],
      },
    ],
  },
});
