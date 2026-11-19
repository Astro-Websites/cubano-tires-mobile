type GlobalConfig = {
  siteName: string;
  phoneDisplay: string;
  phoneDigits: string;
  addressLine1: string;
  addressLine2: string;
  copyright: string;
};

type NavigationItem = { sourceLabel: string; label: string; href: string };
type Navigation = Record<string, NavigationItem[]>;

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function bindGlobalFragment(source: string, config: GlobalConfig, navigation: Navigation) {
  let html = source
    .replaceAll('(888) 333-3173', escapeHtml(config.phoneDisplay))
    .replaceAll('8883333173', escapeHtml(config.phoneDigits))
    .replaceAll('3911 E La Palma Ave, Suite J', escapeHtml(config.addressLine1))
    .replaceAll('Anaheim, CA 92807', escapeHtml(config.addressLine2))
    .replaceAll('© 2026 Cubano Tires Mobile Shop. All rights reserved.', escapeHtml(config.copyright));

  for (const item of Object.values(navigation).flat()) {
    const label = escapeRegExp(item.sourceLabel);
    const pattern = new RegExp(`<a([^>]*?)href="[^"]*"([^>]*?)>${label}</a>`, 'g');
    html = html.replace(pattern, `<a$1href="${escapeHtml(item.href)}"$2>${escapeHtml(item.label)}</a>`);
  }

  return html;
}
