# Environment Variables

## Source of Truth

- `.env.template` for local defaults
- Runtime usage in `src/**` and `next.config.ts`

## Required Variables

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

## Optional Variables

```env
NEXT_PUBLIC_VENDOR_URL=https://vendor.sopet.org
NEXT_PUBLIC_FACEBOOK_APP_ID=
NEXT_PUBLIC_CF_IMAGE_ZONE=https://sopet.org
NEXT_PUBLIC_MEDUSA_BACKEND_URL=
NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID=
MEDUSA_SALES_CHANNEL_ID=
REVALIDATE_SECRET=
```

## Variable Reference

- `MEDUSA_BACKEND_URL`: backend base URL used by SDK/data layer
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`: Medusa publishable API key for storefront requests
- `NEXT_PUBLIC_BASE_URL`: canonical frontend URL for metadata and robots
- `NEXT_PUBLIC_DEFAULT_REGION`: fallback locale/region in routing logic
- `NEXT_PUBLIC_STRIPE_KEY`: Stripe public key
- `NEXT_PUBLIC_SITE_NAME`: SEO/title branding
- `NEXT_PUBLIC_SITE_DESCRIPTION`: SEO description
- `NEXT_PUBLIC_ALGOLIA_ID`: Algolia application ID
- `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`: Algolia search key
- `NEXT_PUBLIC_VENDOR_URL`: "Sell now" destination URL
- `NEXT_PUBLIC_FACEBOOK_APP_ID`: required for Messenger share integration
- `NEXT_PUBLIC_CF_IMAGE_ZONE`: Cloudflare transform zone override for `*.r2.dev` images
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: optional public backend override used in OAuth helper
- `NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID`: optional sales channel header value
- `MEDUSA_SALES_CHANNEL_ID`: server-side fallback sales channel value
- `REVALIDATE_SECRET`: currently present in template; no active direct usage in this codebase

## Important Runtime Behavior

- Missing `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`:
  - development: logs warning
  - production: renders configuration error page in root layout
- Locale fallback defaults differ by file:
  - `src/middleware.ts`: `"us"`
  - `src/app/layout.tsx`: `"th"`
  - some components/pages fallback to `"pl"`

To avoid inconsistent routing behavior, define `NEXT_PUBLIC_DEFAULT_REGION` explicitly in all environments.
