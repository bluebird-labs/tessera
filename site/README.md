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
| Production branch | `main` |
| Build command | `pnpm install --filter '@tessera/site...' --frozen-lockfile && pnpm --filter @tessera/site build` |
| Build output directory | `site/dist` |
| Root directory | *(repo root — leave blank)* |

The filtered install skips the `crates/desktop` (Tauri CLI) and `extractors/ts`
workspaces so CF only fetches the site's own dep tree.

Cloudflare auto-detects pnpm from `pnpm-lock.yaml` and respects the
`packageManager` field in the root `package.json`. Pin Node to match CI by
adding a `NODE_VERSION` environment variable set to `22` (Production + Preview).

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

The email capture posts to the Buttondown newsletter named by `BUTTONDOWN_USER`
in `src/cta.tsx` (currently `sylvainestevez`). It submits with `fetch` instead of
a native form navigation, so the visitor stays on the page and gets an inline
confirmation; the embed endpoint answers cross-origin requests with
`access-control-allow-origin: *`, so the response status is readable (200 =
subscribed, and repeat submissions of the same address are idempotent).
