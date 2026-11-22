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
