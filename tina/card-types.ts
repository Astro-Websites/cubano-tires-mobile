// Repeatable items ("cards") inside designed-page sections. Each type matches a
// <!--repeat:section:type--> block in src/fragments/demo-pages/*.html.
// Field names ending in Url are links; image/photo/logo are images; the rest is text.
type CardField = { name: string; label: string; kind?: 'text' | 'textarea' | 'url' | 'image' };
export const CARD_TYPES: Record<string, { label: string; title: string; fields: CardField[] }> = {
  faq: { label: 'FAQ', title: 'question', fields: [
    { name: 'question', label: 'Question' }, { name: 'answer', label: 'Answer', kind: 'textarea' }] },
  rebate: { label: 'Coupon / Rebate', title: 'brand', fields: [
    { name: 'brand', label: 'Brand or offer name' }, { name: 'tag', label: 'Tag (e.g. REBATE)' }, { name: 'amount', label: 'Amount (e.g. $100)' },
    { name: 'details', label: 'Details and dates', kind: 'textarea' }, { name: 'buttonLabel', label: 'Button text' }, { name: 'buttonUrl', label: 'Button link', kind: 'url' }] },
  review: { label: 'Review', title: 'author', fields: [
    { name: 'quote', label: 'Review text', kind: 'textarea' }, { name: 'author', label: 'Reviewer' },
    { name: 'logo', label: 'Review site logo (homepage only)', kind: 'image' }, { name: 'logoAlt', label: 'Review site name' }] },
  stat: { label: 'Stat', title: 'value', fields: [
    { name: 'value', label: 'Number' }, { name: 'label', label: 'Label' }] },
  person: { label: 'Team member', title: 'name', fields: [
    { name: 'photo', label: 'Photo', kind: 'image' }, { name: 'photoAlt', label: 'Photo description' },
    { name: 'name', label: 'Name' }, { name: 'role', label: 'Role' }, { name: 'bio', label: 'Bio (About page only)', kind: 'textarea' }] },
  photo: { label: 'Photo', title: 'caption', fields: [
    { name: 'image', label: 'Photo', kind: 'image' }, { name: 'imageAlt', label: 'Photo description' },
    { name: 'title', label: 'Title (if shown)' }, { name: 'caption', label: 'Caption' }] },
  logo: { label: 'Logo', title: 'imageAlt', fields: [
    { name: 'image', label: 'Logo', kind: 'image' }, { name: 'imageAlt', label: 'Name' }, { name: 'url', label: 'Link', kind: 'url' }] },
  pill: { label: 'Area / tag link', title: 'label', fields: [
    { name: 'label', label: 'Text' }, { name: 'url', label: 'Link', kind: 'url' }] },
  arrowLink: { label: 'Related link', title: 'label', fields: [
    { name: 'label', label: 'Text' }, { name: 'url', label: 'Link', kind: 'url' }] },
  linkCard: { label: 'Link card', title: 'title', fields: [
    { name: 'image', label: 'Image (if shown)', kind: 'image' }, { name: 'imageAlt', label: 'Image description' },
    { name: 'title', label: 'Title' }, { name: 'text', label: 'Text', kind: 'textarea' }, { name: 'cta', label: 'Link text (if shown)' }, { name: 'url', label: 'Link', kind: 'url' }] },
  service: { label: 'Service card', title: 'title', fields: [
    { name: 'image', label: 'Image', kind: 'image' }, { name: 'imageAlt', label: 'Image description' },
    { name: 'title', label: 'Title' }, { name: 'text', label: 'Text', kind: 'textarea' },
    { name: 'learnMoreLabel', label: 'First button text' }, { name: 'learnMoreUrl', label: 'First button link', kind: 'url' },
    { name: 'callLabel', label: 'Second button text' }, { name: 'callUrl', label: 'Second button link', kind: 'url' }] },
  step: { label: 'Step', title: 'title', fields: [
    { name: 'number', label: 'Number' }, { name: 'title', label: 'Title' }, { name: 'text', label: 'Text', kind: 'textarea' }] },
  feature: { label: 'Feature', title: 'title', fields: [
    { name: 'title', label: 'Title' }, { name: 'text', label: 'Text', kind: 'textarea' }] },
};

export const cardQueryFields = `cards { __typename ${Object.entries(CARD_TYPES)
  .map(([type, card]) => `... on PageDemoSectionsCards${type[0].toUpperCase()}${type.slice(1)} { ${card.fields.map((f) => f.name).join(' ')} }`)
  .join(' ')} }`;
