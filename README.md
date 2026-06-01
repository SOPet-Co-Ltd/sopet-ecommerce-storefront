# Sopet Storefront

Customer-facing frontend for Sopet ecommerce marketplace.

Built with Next.js App Router and integrated with Sopet backend (`sopet-ecommerce-backend`).

## What This App Covers

- Product discovery and search
- Product details, variants, cart, checkout
- Customer auth and profile
- Wishlist, reviews, orders, returns
- Seller pages and marketplace browsing
- External integrations: Stripe, Algolia, social share

## Stack

- Next.js `15.1.x` (App Router)
- React `19`
- TypeScript
- Tailwind CSS
- Medusa JS SDK
- Storybook `8`

## Quick Start

1. Install dependencies:

```bash
yarn install
```

2. Create local env file:

```bash
cp .env.template .env.local
```

3. Set required values in `.env.local`:

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_REGION=th
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_SITE_NAME="Sopet"
NEXT_PUBLIC_SITE_DESCRIPTION="Sopet Storefront"
NEXT_PUBLIC_ALGOLIA_ID=...
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=...
```

4. Start development server:

```bash
yarn dev
```

Default URL: `http://localhost:3000`

## Scripts

- `yarn dev`: run development server (`next dev --turbopack`)
- `yarn build`: build production bundle
- `yarn start`: start production server
- `yarn lint`: run Next.js lint
- `yarn storybook`: run Storybook on port `6006`
- `yarn build-storybook`: build static Storybook
- `yarn format`: format files with Prettier
- `yarn format:check`: check formatting

## Environment Variables

Primary env template: `.env.template`

Technical reference:

- `docs/technical/environment-variables.md`

Important:

- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is required. In production, app renders a configuration error page if missing.
- Backend URL and publishable key must match the backend environment (local/UAT/production).

## Deployment

Deployment is triggered by GitHub Actions workflow:

- `.github/workflows/deploy.yml`

Branch mapping:

- `main` -> Vercel production deploy hook
- `uat` -> Vercel UAT deploy hook

## Technical Documentation

- Docs index: `docs/technical/README.md`
- Architecture: `docs/technical/architecture.md`
- Env vars: `docs/technical/environment-variables.md`
- Deployment: `docs/technical/deployment.md`
- Operations: `docs/technical/operations.md`
- Cart behavior: `docs/technical/cart.md`

## Repository Structure

```txt
src/app/                Next.js app routes and layouts
src/lib/data/           Backend API integration layer
src/components/         UI components (atoms/molecules/organisms/sections)
src/hooks/              UI and routing hooks
src/lib/helpers/        Shared helpers and utils
src/lib/images/         Image loader logic
public/                 Static assets
.storybook/             Storybook config
```

properties of sopet.co 2026 all rights reserved.

hh
