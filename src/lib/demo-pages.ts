// Designed pages: each design lives in src/fragments/demo-pages/<template>.html with
// @@section:list:index:field@@ slots. The values live in Tina (src/content/<collection>/**.md).
import { cardQueryFieldsFor } from '../../tina/card-types';
import type { DesignedCollection } from './page-collections';
// Repeatable groups are wrapped in <!--repeat:section:type--> ... <!--/repeat--> and
// use @@section:cards:#:field@@ slots, filled from demoSections[section].cards.
type Row = Record<string, any> & { _content_source?: { queryId: string; path: (string | number)[] } };
export type Section = { label: string; copy: Row[]; links: Row[]; images: Row[]; cards?: Row[] };
export type DemoPage = { title: string; seoTitle?: string; description: string; demoSections: Section[]; demoTemplate: string; _sys?: unknown };

const fieldsFor = (prefix: string) => `__typename _sys { filename basename path relativePath extension } title seoTitle description demoTemplate
    demoSections { label copy { text } links { label url newTab } images { source alt } ${cardQueryFieldsFor(prefix)} }`;
// Live preview query per Tina collection. Pages has two types, so its designed fields sit in an
// "... on PageDesigned" fragment; the folder collections (Areas, Services, ...) have one.
export const designedQuery = (collection: DesignedCollection) => {
  const prefix = collection === 'page' ? 'PageDesigned' : collection[0].toUpperCase() + collection.slice(1);
  const fields = fieldsFor(prefix);
  return `query CubanoDesigned($relativePath: String!) {
  ${collection}(relativePath: $relativePath) { ${collection === 'page' ? `... on PageDesigned { ${fields} }` : fields} }
}`;
};

// Business facts typed as {{token}} in any text, link or alt field are filled from Global Config,
// so the phone, address and hours are stored once. See GLOBAL_TOKENS for the list.
export type Globals = Record<string, string>;
export const GLOBAL_TOKENS = ['siteName', 'phone', 'phoneDigits', 'email', 'address', 'addressLine1', 'addressLine2', 'weekdayDays', 'weekdayHours', 'weekendDays', 'weekendHours', 'addressQuery', 'mapQuery', 'formEmail', 'turnstileSiteKey'] as const;
export function globalsFrom(config: Record<string, any>): Globals {
  const hours = config?.hours || {};
  return {
    siteName: config?.siteName || '', phone: config?.phoneDisplay || '', phoneDigits: config?.phoneDigits || '', email: config?.email || '',
    address: [config?.addressLine1, config?.addressLine2].filter(Boolean).join(', '), addressLine1: config?.addressLine1 || '', addressLine2: config?.addressLine2 || '',
    weekdayDays: hours.weekdayLabel || '', weekdayHours: hours.weekdayHours || '', weekendDays: hours.weekendLabel || '', weekendHours: hours.weekendHours || '',
    formEmail: config?.formEmail || config?.email || '',
    turnstileSiteKey: config?.turnstileSiteKey || '',
    addressQuery: encodeURIComponent([config?.addressLine1, config?.addressLine2].filter(Boolean).join(', ')),
    // Business name + address, so Google resolves the embed to the Business Profile pin (named, with rating) instead of a bare address pin.
    mapQuery: encodeURIComponent([config?.siteName, config?.addressLine1, config?.addressLine2].filter(Boolean).join(', ')),
  };
}
export const fillTokens = (value: unknown, globals?: Globals) =>
  globals && typeof value === 'string' ? value.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in globals ? globals[key] : match)) : value;

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => entities[char]);
const SLOT = /@@(\d+):(copy|links|images|cards):(\d+):(\w+)@@/g;

type Kind = 'text' | 'url' | 'image';
function kindOf(list: string, field: string): Kind {
  if (list === 'links') return field === 'url' ? 'url' : 'text';
  if (list === 'images') return field === 'source' ? 'image' : 'text';
  if (list === 'cards') return /url$/i.test(field) ? 'url' : /^(image|photo|logo)$/.test(field) ? 'image' : 'text';
  return 'text';
}

function clean(kind: Kind, raw: unknown) {
  let value = String(raw ?? '');
  if (kind === 'url' || kind === 'image') {
    value = value.trim().replace(/ +/g, '%20'); // editors often paste addresses with spaces
    const allowed = /^(?:\/(?![/\\])|https:\/\/)/i.test(value) || (kind === 'url' && /^(?:#|tel:|sms:|mailto:)/i.test(value));
    if (!allowed || /[\u0000- \\]/.test(value)) value = kind === 'url' ? '#' : '';
  }
  return value;
}

// Tina's click-to-edit id for a field, available only on data that came through useTina.
function tinaField(row: Row | undefined, field: string) {
  const source = row?._content_source;
  return source ? `${source.queryId}---${[...source.path, field].join('.')}` : '';
}

// Tina names card types <Collection>DemoSectionsCards<Type> (e.g. GalleryDemoSectionsCardsPhoto, PageDesignedDemoSectionsCardsFaq).
const cardType = (card: Row) => card?._template || String(card?.__typename || '').replace(/^\w*?DemoSectionsCards/, '').replace(/^./, (c) => c.toLowerCase());

export function renderDemo(template: string, page: DemoPage, options: { preview?: boolean; globals?: Globals } = {}) {
  const sections = page.demoSections || [];
  const expanded = template.replace(/<!--repeat:(\d+):(\w+)-->([\s\S]*?)<!--\/repeat-->/g, (_, section, type, block: string) =>
    (sections[+section]?.cards || [])
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => cardType(card) === type)
      .map(({ index }) => block.replaceAll(`@@${section}:cards:#:`, `@@${section}:cards:${index}:`))
      .join('\n'));

  const lookup = (section: string, list: string, index: string) =>
    (sections[+section] as unknown as Record<string, Row[]> | undefined)?.[list]?.[+index];

  return expanded.replace(/<[^>]*>|[^<]+/g, (token) => {
    if (token.startsWith('<')) {
      let field = '';
      let newTab = false;
      const tag = token.replace(SLOT, (_, section, list, index, name) => {
        const row = lookup(section, list, index);
        const kind = kindOf(list, name);
        if (kind === 'image' && options.preview) field ||= tinaField(row, name);
        if (kind === 'url' && row?.newTab) newTab = true;
        return escape(clean(kind, fillTokens(row?.[name], options.globals)));
      });
      const extra = (newTab ? ' target="_blank" rel="noopener"' : '') + (field ? ` data-tina-field="${escape(field)}"` : '');
      return extra ? tag.replace(/\s*(\/?)>$/, `${extra}$1>`) : tag;
    }
    return token.replace(SLOT, (_, section, list, index, name) => {
      const row = lookup(section, list, index);
      const value = escape(clean(kindOf(list, name), fillTokens(row?.[name], options.globals)));
      const field = options.preview ? tinaField(row, name) : '';
      return field ? `<span data-tina-field="${escape(field)}">${value}</span>` : value;
    });
  });
}
