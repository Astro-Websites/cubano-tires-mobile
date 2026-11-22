import type { APIRoute } from 'astro';

// Staging hosts (staging.*) block all crawlers; any other site URL allows crawling and lists the sitemap.
export const GET: APIRoute = ({ site }) => {
  const staging = !site || site.hostname.startsWith('staging.');
  const body = staging
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
