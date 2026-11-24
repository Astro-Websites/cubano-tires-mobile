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

type NavigationLink = { label?: string | null; href?: string | null };
type NavigationItem = NavigationLink & { sourceLabel?: string | null; children?: NavigationLink[] | null };
type FooterColumn = { heading?: string | null; hidden?: boolean | null; links?: NavigationLink[] | null };
type Navigation = {
  header?: NavigationItem[] | null;
  footerColumns?: FooterColumn[] | null;
  social?: NavigationItem[] | null;
  legal?: NavigationItem[] | null;
};

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
  for (const item of [...(navigation.header || []), ...(navigation.social || []), ...(navigation.legal || [])]) {
    if (!item?.sourceLabel || !item.label || !item.href) continue;
    const label = `(?:${escapeRegExp(item.sourceLabel)}|${escapeRegExp(escapeHtml(item.sourceLabel))})`;
    const pattern = new RegExp(`<a([^>]*?)href="[^"]*"([^>]*?)>${label}</a>`, 'g');
    html = html.replace(pattern, `<a$1href="${escapeHtml(safeHref(item.href))}"$2>${escapeHtml(item.label)}</a>`);
  }

  // Each menu is rebuilt from its Tina list, so items can be added, removed and reordered in Tina.
  const menus: Array<[string, RegExp]> = placement === 'header'
    ? [['social', /(<span style="display: flex; flex-wrap: wrap; gap: 20px">)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/],
       ['header', /(<div id="cub-links"[^>]*>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/]]
    : [['legal', /(<nav aria-label="Legal"[^>]*>)((?:\s*<a\b[^>]*>[^<]*<\/a>)+)/]];
  for (const [group, pattern] of menus) {
    const items = (navigation[group as 'header' | 'social' | 'legal'] || []).filter((item) => item?.label && item?.href);
    html = html.replace(pattern, (_, open: string, run: string) => {
      const newline = run.startsWith('\n') ? '\n' : '';
      const attrs = (run.match(/<a\b([^>]*)>/)?.[1] || '').replace(/\s*href="[^"]*"/, '');
      return open + items.map((item, index) => {
        const href = safeHref(item.href || '');
        if (group === 'header') return newline + headerItem(item, href, index);
        const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
        return `${newline}<a href="${escapeHtml(href)}"${external}${attrs}>${escapeHtml(item.label || '')}</a>`;
      }).join('');
    });
  }

  // Footer link columns (plus "Follow Us" from Social Links) are rebuilt from Navigation → Footer Link Columns.
  if (placement === 'footer') {
    const columns = [
      ...(navigation.footerColumns || []).filter((column) => column && !column.hidden).map((column) => ({ heading: column?.heading || '', links: column?.links || [] })),
      { heading: 'Follow Us', links: navigation.social || [] },
    ].map((column) => ({ ...column, links: column.links.filter((link) => link?.label && link?.href) }))
      .filter((column) => column.heading && column.links.length);
    const markup = `<nav class="cub-fcols" aria-label="Footer">${columns.map((column) => `
<div class="cub-fcol"><span class="cub-fhead">${escapeHtml(column.heading)}</span><ul>${column.links.map((link) => `<li>${anchor(link)}</li>`).join('')}</ul></div>`).join('')}
</nav>`;
    html = html.replace(/<div style="flex: 2 1 460px[^>]*>[\s\S]*?>Follow Us<\/span>(?:\s*<a\b[^>]*>[^<]*<\/a>)*\s*<\/div>\s*<\/div>/, markup);
  }

  return html;
}

function anchor(link: NavigationLink, extra = '') {
  const href = safeHref(link.href || '');
  const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
  return `<a href="${escapeHtml(href)}"${external}${extra}>${escapeHtml(link.label || '')}</a>`;
}

// A header item with Dropdown Links becomes a parent link plus a toggle button and a sub-menu.
function headerItem(item: NavigationItem, href: string, index: number) {
  const children = (item.children || []).filter((child) => child?.label && child?.href);
  const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
  const top = `<a href="${escapeHtml(href)}"${external}>${escapeHtml(item.label || '')}</a>`;
  if (!children.length) return top;
  const id = `cub-sub-${index}`;
  return `<div class="cub-dd">${top}<button type="button" class="cub-dd-btn" aria-expanded="false" aria-controls="${id}" aria-label="${escapeHtml(`${item.label} menu`)}"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><ul class="cub-dd-menu" id="${id}">${children.map((child) => `<li>${anchor(child)}</li>`).join('')}</ul></div>`;
}
