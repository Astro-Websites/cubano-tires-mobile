# Cubano Tires Mobile

Astro + TinaCMS source for the Cubano Tires Mobile website.

## Development

```bash
npm ci
npm run dev
```

## Validation and build

```bash
npm run build:full
```

The canonical source branch is `main`. Cloudflare Workers Builds (`cubano-tires-staging`, see `wrangler.jsonc`) builds every push to `main` and serves `dist/` at `https://staging.cubano.blissdrive.net/`.

The Tina build step needs two Cloudflare build variables: `NEXT_PUBLIC_TINA_CLIENT_ID` and the secret `TINA_TOKEN`. Redirects live in `public/_redirects`.

## Where page content lives

Every designed page (homepage, services, areas, vehicles, about, coupons) is a design template plus Tina content:

- Design: `src/fragments/demo-pages/<template>.html`, with `@@section:list:index:field@@` slots. Edit this only to change layout.
- Content: `src/content/page/**.md` (Tina: **Pages**). All text, links and images are here, under `demoSections`. Edit copy and prices here, not in the HTML.
- `title` is the short page name shown in Tina; `seoTitle` is the browser tab and Google title.
- In the Tina visual editor, clicking any text or image in the preview opens its field.

Repeated blocks (FAQs, coupons/rebates, team, photos, reviews, steps, links) are `cards` lists in each section, marked in the template with `<!--repeat:section:type-->`; card types are defined in `tina/card-types.ts`.

Simple pages (Tina: **Simple Pages**, `src/content/simple-page/*.md`) are a generic heading + rich-text template served at `/<file-name>/`.

Helpers for bulk content edits are in `scripts/designed_pages.py`.
