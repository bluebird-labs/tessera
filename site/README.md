# @tessera/site

The public marketing site for Tessera. Standalone Vite + React + TypeScript
app — **not** part of the Tauri desktop crate. JSX is compiled ahead of time
with esbuild (no in-browser Babel), ships production React, and emits
content-hashed, long-cacheable assets.

## Local

From the repo root:

```bash
cargo xtask site           # vite dev server (http://localhost:5173)
cargo xtask site-build     # production build → site/dist
```

Or talk to pnpm directly:

```bash
pnpm --filter @tessera/site dev
pnpm --filter @tessera/site build
pnpm --filter @tessera/site preview    # serve the production build
pnpm --filter @tessera/site typecheck  # tsc --noEmit
```

## Deploy — Cloudflare Pages (Git integration)

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
Git**, pick this repo and set:

| Setting | Value |
| --- | --- |
| Framework preset | None / Vite |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @tessera/site build` |
| Build output directory | `site/dist` |
| Root directory | *(repo root — leave blank)* |

Cloudflare auto-detects pnpm from `pnpm-lock.yaml`. If you want to pin Node, add
a `NODE_VERSION` environment variable (e.g. `22`).

### Analytics
After the first deploy, open the Pages project → **Metrics → Web Analytics →
Enable**. Cloudflare injects the tracking beacon automatically — no code change,
no cookie banner. (If you ever host this elsewhere, paste the beacon `<script>`
just above `</body>` in `index.html`.)

### Custom domain (GoDaddy)
Pages project → **Custom domains → Set up a domain** → enter the GoDaddy domain,
then point GoDaddy's nameservers at the two Cloudflare provides (full
delegation). HTTPS is provisioned automatically.

## Config

The three design knobs that used to be live "tweaks" are now fixed production
config at the top of `src/app.tsx` (`VIBE`, `ACCENT`, `CASCADE_MOTION`). Change
them there to re-theme the whole page.

The email capture posts to Buttondown — set `BUTTONDOWN_USER` in `src/cta.tsx`.
