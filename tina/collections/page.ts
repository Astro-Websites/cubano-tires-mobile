import type { Collection, Template, TinaField } from 'tinacms';
import { CARD_TYPES } from '../card-types';

const cardTemplates: Template[] = Object.entries(CARD_TYPES).map(([name, card]) => ({
  name,
  label: card.label,
  ui: { itemProps: (item: Record<string, string>) => ({ label: item?.[card.title] ? `${card.label}: ${item[card.title]}` : card.label }) },
  fields: card.fields.map((field) => field.kind === 'image'
    ? { type: 'image' as const, name: field.name, label: field.label }
    : { type: 'string' as const, name: field.name, label: field.label, ...(/Alt$/.test(field.name) ? { description: 'Alt text for SEO: describe the image for Google and screen readers.' } : {}), ...(field.kind === 'textarea' ? { ui: { component: 'textarea' } } : {}) }),
}));

export const designedPageFields: TinaField[] = [
  { type: 'string', name: 'title', label: 'Page Name', isTitle: true, required: true, description: 'Short name shown in the CMS list, e.g. "About Us".' },
  { type: 'string', name: 'seoTitle', label: 'SEO Title', description: 'Browser tab and Google title. Falls back to the page name when empty.' },
  { type: 'string', name: 'description', label: 'Meta Description', required: true, ui: { component: 'textarea' } },
  { type: 'string', name: 'demoTemplate', label: 'Layout', ui: { component: 'hidden' } },
  {
    type: 'object', name: 'demoSections', label: 'Page Sections', list: true,
    description: 'Tip: click any text or image in the page preview to jump straight to its field. Business facts come from Global Config: type {{phone}}, {{phoneDigits}}, {{email}}, {{address}}, {{weekdayDays}}, {{weekdayHours}}, {{weekendDays}} or {{weekendHours}} and the current value is filled in everywhere.',
    ui: { itemProps: (item) => ({ label: item?.label }) },
    fields: [
      { type: 'string', name: 'label', label: 'Section Label' },
      { type: 'object', name: 'copy', label: 'Text', list: true, ui: { itemProps: (item) => ({ label: [item?.role, item?.text?.slice(0, 70)].filter(Boolean).join(': ') }) }, fields: [
        { type: 'string', name: 'role', label: 'Role', ui: { component: 'hidden' } },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
      ] },
      { type: 'object', name: 'links', label: 'Buttons & Links', list: true, ui: { itemProps: (item) => ({ label: [item?.role, item?.label].filter(Boolean).join(': ') }) }, fields: [
        { type: 'string', name: 'role', label: 'Role', ui: { component: 'hidden' } },
        { type: 'string', name: 'label', label: 'Button / Link Text' },
        { type: 'string', name: 'url', label: 'Link URL', description: 'A page like /coupons/, a section like #faq, a full https:// address, tel:8883333173 or sms:8883333173.' },
        { type: 'boolean', name: 'newTab', label: 'Open in a new tab' },
      ] },
      { type: 'object', name: 'images', label: 'Images', list: true, ui: { itemProps: (item) => ({ label: [item?.role, item?.alt].filter(Boolean).join(': ') }) }, fields: [
        { type: 'string', name: 'role', label: 'Role', ui: { component: 'hidden' } },
        { type: 'image', name: 'source', label: 'Image' }, { type: 'string', name: 'alt', label: 'Alt Text (SEO)', description: 'Describe the image for Google and screen readers, e.g. "Technician replacing a semi truck tire in Anaheim".' },
      ] },
      { type: 'object', name: 'cards', label: 'Repeating items (add, remove, reorder)', list: true, templates: cardTemplates,
        description: 'FAQs, coupons, team members, photos, reviews and similar. New items must use the same type as the ones already in this section.' },
    ],
  },
];

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
  fields: designedPageFields,
};
