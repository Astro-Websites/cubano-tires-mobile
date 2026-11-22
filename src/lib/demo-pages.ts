// Designed pages: each design lives in src/fragments/demo-pages/<template>.html with
// @@section:list:index:field@@ slots. The values live in Tina (src/content/page/**.md).
import { cardQueryFields } from '../../tina/card-types';
// Repeatable groups are wrapped in <!--repeat:section:type--> ... <!--/repeat--> and
// use @@section:cards:#:field@@ slots, filled from demoSections[section].cards.
type Row = Record<string, any> & { _content_source?: { queryId: string; path: (string | number)[] } };
export type Section = { label: string; copy: Row[]; links: Row[]; images: Row[]; cards?: Row[] };
export type DemoPage = { title: string; seoTitle?: string; description: string; demoSections: Section[]; demoTemplate: string; _sys?: unknown };

export const pageFields = `__typename _sys { filename basename path relativePath extension } title seoTitle description demoTemplate
    demoSections { label copy { text } links { label url } images { source alt } ${cardQueryFields} }`;
export const pageQuery = `query CubanoPage($relativePath: String!) {
  page(relativePath: $relativePath) { ${pageFields} }
}`;

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => entities[char]);
const SLOT = /@@(\d+):(copy|links|images|cards):(\d+):(\w+)@@/g;

type Kind = 'text' | 'url' | 'image';
function kindOf(list: string, field: string): Kind {
  if (list === 'links') return field === 'url' ? 'url' : 'text';
  if (list === 'images') return field === 'source' ? 'image' : 'text';
  if (list === 'cards') return /url$/i.test(field) ? 'url' : /^(image|photo)$/.test(field) ? 'image' : 'text';
  return 'text';
}

function clean(kind: Kind, raw: unknown) {
  let value = String(raw ?? '');
  if (kind === 'url' || kind === 'image') {
    value = value.trim();
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

const cardType = (card: Row) => card?._template || String(card?.__typename || '').replace(/^PageDemoSectionsCards/, '').replace(/^./, (c) => c.toLowerCase());

export function renderDemo(template: string, page: DemoPage, options: { preview?: boolean } = {}) {
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
      const tag = token.replace(SLOT, (_, section, list, index, name) => {
        const row = lookup(section, list, index);
        const kind = kindOf(list, name);
        if (kind === 'image' && options.preview) field ||= tinaField(row, name);
        return escape(clean(kind, row?.[name]));
      });
      return field ? tag.replace(/\s*(\/?)>$/, ` data-tina-field="${escape(field)}"$1>`) : tag;
    }
    return token.replace(SLOT, (_, section, list, index, name) => {
      const row = lookup(section, list, index);
      const value = escape(clean(kindOf(list, name), row?.[name]));
      const field = options.preview ? tinaField(row, name) : '';
      return field ? `<span data-tina-field="${escape(field)}">${value}</span>` : value;
    });
  });
}
