import { chromium } from '@playwright/test';

const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const toggle = document.querySelector('.cub-tog');
      return {
        title: document.title,
        header: Boolean(header),
        footer: Boolean(footer),
        hero: Boolean(document.querySelector('#top')),
        sections: document.querySelectorAll('section').length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        toggleVisible: toggle ? getComputedStyle(toggle).display !== 'none' : false,
        menuVisible: getComputedStyle(document.querySelector('.cub-menu')).display !== 'none',
        headingFamily: getComputedStyle(document.querySelector('h1')).fontFamily,
        bodyFamily: getComputedStyle(document.body).fontFamily,
      };
    });
    if (viewport.name === 'mobile') {
      await page.locator('.cub-tog').click();
      state.menuOpened = await page.locator('header').evaluate((node) => node.classList.contains('open'));
      state.ariaExpanded = await page.locator('.cub-tog').getAttribute('aria-expanded');
    }
    const pass = state.header && state.footer && state.hero && state.sections === 16 && state.overflow <= 0
      && state.headingFamily.includes('Montserrat') && state.bodyFamily.includes('Inter')
      && (viewport.name === 'desktop' ? !state.toggleVisible : state.toggleVisible && state.menuOpened && state.ariaExpanded === 'true');
    results.push({ viewport: viewport.name, pass, state, pageErrors: errors });
    await page.screenshot({ path: `evidence/local-${viewport.name}-top.png` });
    if (viewport.name === 'mobile') await page.locator('.cub-tog').click();
    await page.screenshot({ path: `evidence/local-${viewport.name}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.screenshot({ path: `evidence/local-${viewport.name}-bottom.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
if (results.some((result) => !result.pass)) {
  console.error(JSON.stringify({ gate: 'LOCAL_DESKTOP_MOBILE', status: 'FAIL', origin, results }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ gate: 'LOCAL_DESKTOP_MOBILE', status: 'PASS', origin, results }, null, 2));
