# apphub

[![license: AGPL-3.0-or-later](https://img.shields.io/badge/license-AGPL--3.0-or-later-blue.svg)](./LICENSE)
[![runtime: Cloudflare Pages](https://img.shields.io/badge/runtime-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)
[![framework: React 19 + Vite 8](https://img.shields.io/badge/framework-React%2019%20%2B%20Vite%208-61dafb.svg)](https://react.dev/)
[![D1 binding](https://img.shields.io/badge/storage-Cloudflare%20D1-blue.svg)](https://developers.cloudflare.com/d1/)

Cloudflare Pages portal hub. Static landing + PWA dispatcher routing visitors to a configurable set of sub-applications via a card-grid UI, backed by Cloudflare D1.

## What it does

`apphub` is a thin React landing page that surfaces a grid of cards, each pointing to a sub-application. The card list is data-driven via `public/cards.json` — adding a new sub-app = appending one row.

The page registers as a PWA (manifest + service worker scaffolding via Vite plugins), so first-visit installs to the home screen, subsequent loads are fully offline-capable for the static shell. Per-card backends (when needed) live in `functions/api/*` as Cloudflare Pages Functions backed by a D1 binding (`BIGDATA_DB`).

## Architecture

```
Browser -> Cloudflare Pages (static React build, PWA manifest + service worker)
                   |
                   v
         <Card> components in src/modules/* fed by public/cards.json
                   |
       (client-side fetch to /api/* on same origin OR cross-origin to other apps)
                   |
                   v
       Cloudflare Pages Functions (functions/api/*)
                   |
                   v
            D1 binding: BIGDATA_DB
```

## Deploy your own fork

You will need:
- A Cloudflare account ([free tier](https://www.cloudflare.com/plans/)) with Pages + D1 enabled.
- The Cloudflare CLI [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) (installed locally OR used via `npx`).
- Node.js 22+.

### 1. Clone + install

```bash
git clone https://github.com/lcv-leo/apphub.git
cd apphub
npm ci
```

### 2. Create your D1 database

```bash
npx wrangler d1 create bigdata_db
# wrangler outputs:
#   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Take note of the `database_id` value — you need it for step 3 BEFORE any `wrangler d1 execute` command can run.

### 3. Wire the database_id into wrangler.json

`wrangler.json` ships with a placeholder `00000000-0000-0000-0000-000000000000`. Replace it with the ID from step 2:

```jsonc
{
  "d1_databases": [
    {
      "binding": "BIGDATA_DB",
      "database_name": "bigdata_db",
      "database_id": "<your-d1-id-from-step-2>"
    }
  ]
}
```

### 4. Build + deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=apphub
```

The first deploy creates the Pages project on your Cloudflare account. Subsequent deploys update it.

### 5. Customize the card list

Edit `public/cards.json` to declare your own sub-app cards. Each card is `{ title, description, href, icon }`.

## CI deploy (this repo)

This repo's [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm install → npm run build → wrangler pages deploy` on every push to `main`. Before the deploy step, a `jq` substitution swaps the placeholder `database_id` in `wrangler.json` from a `D1_DATABASE_ID` GitHub Actions secret — keeping the literal D1 ID out of the public source tree.

For your fork, the alternatives are:
- Edit `wrangler.json` directly with your real ID (commit your real ID — fine for private forks).
- Replicate the secret-injection pattern: set a `D1_DATABASE_ID` repo secret, keep the placeholder in committed `wrangler.json`.

## Repository conventions

- **License**: [AGPL-3.0-or-later](./LICENSE). Network-service trigger applies — running a modified fork as a service obligates you to publish the modifications. See the AGPL §13 source-offer section below.
- **Security disclosure**: see [SECURITY.md](./SECURITY.md).
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md).
- **Sponsorship**: see the repo's `Sponsor` button or [GitHub Sponsors profile](https://github.com/sponsors/lcv-leo).
- **Action pinning**: all GitHub Actions are pinned by full SHA per supply-chain hardening baseline.
- **Code owners**: see [.github/CODEOWNERS](./.github/CODEOWNERS).

## License

Copyright (C) 2026 Leonardo Cardozo Vargas.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details. The full license text is at [LICENSE](./LICENSE).

### AGPL §13 source-offer (operators of public deployments)

If you operate a modified copy of this app as a publicly-accessible network service, AGPL-3.0 §13 obligates you to make the corresponding source code available to your remote users. The standard React app shell already provides a UI; comply via:

- A "Source" link in the app's footer or about page pointing to your fork's repository URL.
- A `GET /source` route in `functions/api/` returning your fork's URL as `text/plain`.

If you only deploy this app for your own infrastructure (no external users), §13 does not apply.
