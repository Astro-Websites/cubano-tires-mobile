type Homepage = {
  hero?: {
    badge?: string;
    displayTitle?: string;
    heading?: string;
    intro?: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  };
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

export function bindHomepageFragment(source: string, page: Homepage) {
  const hero = page.hero;
  if (!hero) return source;

  let html = source;
  const replacements: Array<[string, string | undefined]> = [
    ['5.0 from 336 Google reviews · 230+ on Yelp', hero.badge],
    ['WE COME<br>TO YOU!', hero.displayTitle?.replace(/\n/g, '<br>')],
    ['Mobile Tire &amp; Fleet Service in Orange County &amp; LA', hero.heading],
    ['Skip the tire shop. Our fully stocked service trucks come to your driveway, job site or fleet yard and handle installs, repairs and replacements on the spot, for cars, EVs and heavy commercial equipment.', hero.intro],
    ['Call (888) 333-3173', hero.primaryCtaLabel],
    ['Text Us Your Tire Size', hero.secondaryCtaLabel],
  ];
  for (const [original, replacement] of replacements) {
    if (replacement) html = html.replace(original, escapeHtml(replacement).replaceAll('&lt;br&gt;', '<br>'));
  }
  if (hero.primaryCtaHref) html = html.replace('href="tel:8883333173"', `href="${escapeHtml(hero.primaryCtaHref)}"`);
  if (hero.secondaryCtaHref) html = html.replace('href="sms:8883333173"', `href="${escapeHtml(hero.secondaryCtaHref)}"`);
  return html;
}