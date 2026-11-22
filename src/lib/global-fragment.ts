type GlobalConfig = {
  siteName: string;
  seo?: { description?: string; logo?: string; favicon?: string; footerLogo?: string; logoAlt?: string; footerLogoAlt?: string };
  phoneDisplay: string;
  phoneDigits: string;
  addressLine1: string;
  addressLine2: string;
  copyright: string;
  announcement?: string;
  hours?: { weekdayLabel?: string; weekdayHours?: string; weekendLabel?: string; weekendHours?: string };
  codeInjection?: { headerCode?: string; footerCode?: string };
};

type NavigationItem = { sourceLabel?: string; label: string; href: string };
type Navigation = Record<string, NavigationItem[]>;

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

// Only site paths, anchors, web, phone and email links; anything else becomes "#".
const safeHref = (value: string) => {
  const href = String(value || '').trim();
  return /^(?:\/(?![/\\])|#|https?:\/\/|tel:|sms:|mailto:)/i.test(href) && !/[\u0000- ]/.test(href) ? href : '#';
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function bindGlobalFragment(source: string, config: GlobalConfig, navigation: Navigation, placement: 'header' | 'footer') {
  let html = source
    .replaceAll('(888) 333-3173', escapeHtml(config.phoneDisplay))
    .replaceAll('8883333173', escapeHtml(config.phoneDigits))
    .replaceAll('3911 E La Palma Ave, Suite J', escapeHtml(config.addressLine1))
    .replaceAll('Anaheim, CA 92807', escapeHtml(config.addressLine2))
    .replaceAll('© 2026 Cubano Tires Mobile Shop. All rights reserved.', escapeHtml(config.copyright));

  if (config.announcement) html = html.replace('$75 mobile fee waived with 4 new tires in Orange County', escapeHtml(config.announcement));
  const hours = config.hours || {};
  const hourRows: Array<[string, string | undefined]> = [
    ['<span>Monday – Friday</span>', hours.weekdayLabel && `<span>${escapeHtml(hours.weekdayLabel)}</span>`],
    ['font-weight: 700">8:00 AM – 5:00 PM<', hours.weekdayHours && `font-weight: 700">${escapeHtml(hours.weekdayHours)}<`],
    ['<span>Saturday – Sunday</span>', hours.weekendLabel && `<span>${escapeHtml(hours.weekendLabel)}</span>`],
    ['font-weight: 700">Closed<', hours.weekendHours && `font-weight: 700">${escapeHtml(hours.weekendHours)}<`],
  ];
  for (const [original, replacement] of hourRows) if (replacement) html = html.replace(original, replacement);

  // The header logo links to "#top", which only exists on some pages; send it home instead.
  if (placement === 'header') html = html.replace('<a href="#top" style="display: flex; align-items: center">', '<a href="/" style="display: flex; align-items: center">');

  const logo = placement === 'footer' ? (config.seo?.footerLogo || config.seo?.logo) : config.seo?.logo;
  const logoAlt = placement === 'footer' ? (config.seo?.footerLogoAlt || config.seo?.logoAlt) : config.seo?.logoAlt;
  if (logoAlt) html = html.replace('alt="Cubano Tires Mobile Shop"', `alt="${escapeHtml(logoAlt)}"`);
  if (logo) {
    html = html.replace(/(<img\s+src=")[^"]+("[^>]*>)/i, `$1${escapeHtml(logo)}$2`);
  }

  // Links outside the menus below (e.g. the mobile action bar's "Shop Tires") are matched by their original label.
  for (const item of Object.values(navigation).flat()) {
    if (!item?.sourceLabel) continue;
    const label = `(?:${escapeRegExp(item.sourceLabel)}|${escapeRegExp(escapeHtml(item.sourceLabel))})`;
    const pattern = new RegExp(`<a([^>]*?)href="[^"]*"([^>]*?)>${label}</a>`, 'g');
    html = html.replace(pattern, `<a$1href="${escapeHtml(safeHref(item.href))}"$2>${escapeHtml(item.label)}</a>`);
  }

  // Each menu is rebuilt from its Tina list, so items can be added, removed and reordered in Tina.
  const menus: Array<[string, RegExp]> = placement === 'header'
    ? [['social', /(<span style="display: flex; flex-wrap: wrap; gap: 20px">)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/],
       ['header', /(<div id="cub-links"[^>]*>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/]]
    : [['services', /(>Services<\/span>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/],
       ['company', /(>Company<\/span>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/],
       ['social', /(>Follow Us<\/span>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/],
       ['legal', /(<nav aria-label="Legal"[^>]*>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/]];
  for (const [group, pattern] of menus) {
    const items = (navigation[group] || []).filter((item) => item?.label && item?.href);
    html = html.replace(pattern, (_, open: string, run: string) => {
      const newline = run.startsWith('\n') ? '\n' : '';
      const attrs = (run.match(/<a\b([^>]*)>/)?.[1] || '').replace(/\s*href="[^"]*"/, '');
      return open + items.map((item) => {
        const href = safeHref(item.href);
        const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
        return `${newline}<a href="${escapeHtml(href)}"${external}${attrs}>${escapeHtml(item.label)}</a>`;
      }).join('');
    });
  }

  return html;
}
