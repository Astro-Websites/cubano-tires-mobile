export type Section = { label: string; copy: {text: string}[]; links: {url: string; label: string}[]; images: {source: string; alt: string}[] };
export type DemoPage = { title: string; description: string; demoSections: Section[]; demoTemplate: string; _sys?: unknown };
export const pageQuery = `query CubanoPage($relativePath: String!) {
  page(relativePath: $relativePath) { __typename _sys { filename basename path relativePath extension } title description demoTemplate
    demoSections { label copy { text } links { label url } images { source alt } }
  }
}`;
const html: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function renderDemo(template: string, page: DemoPage) {
  return template.replace(/@@(\d+):(copy|links|images):(\d+):(text|url|source|alt)@@/g, (_, section, list, index, field) => {
    const row = page.demoSections?.[+section]?.[list as 'copy'|'links'|'images']?.[+index];
    let value = String((row as Record<string,string> | undefined)?.[field] ?? '');
    if (field === 'url' || field === 'source') {
      value = value.trim();
      const allowed = /^(?:\/(?![/\\])|https:\/\/)/i.test(value) || (field === 'url' && /^(?:#|tel:|sms:)/i.test(value));
      if (!allowed || /[\u0000-\u0020\\]/.test(value)) value = field === 'url' ? '#' : '';
    }
    return value.replace(/[&<>"']/g, (char) => html[char]);
  });
}
