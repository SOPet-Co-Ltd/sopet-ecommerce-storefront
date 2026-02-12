# Storefront Architecture

## High-Level Overview

The storefront is a Next.js App Router application that renders UI server-side and client-side, while consuming commerce APIs from the SOPet backend.

- Frontend runtime: Next.js (`next dev`, `next start`)
- Backend integration: Medusa JS SDK + direct `fetch` calls
- Primary backend target: `MEDUSA_BACKEND_URL`
- Auth state: `_medusa_jwt` cookie

## Core Runtime Flow

1. Request enters `src/middleware.ts`.
2. Middleware enforces locale prefix and protects `/user` routes.
3. Route handlers/layouts under `src/app/[locale]/**` render pages.
4. Data access functions in `src/lib/data/*` call backend APIs.
5. UI renders via component layers in `src/components/*`.

## Routing Model

- Next.js App Router
- Locale-scoped route groups under `src/app/[locale]`
- Route groups:
  - `(main)`: product browsing, cart, account surfaces
  - `(auth)`: login/register/oauth success
  - `(checkout)`: checkout flows
  - `(reset-password)`: password reset flows

## Middleware Behavior

Defined in `src/middleware.ts`:

- Redirects non-localized URLs to `/<default-locale>/...`
- Handles protected user routes (`/user`) by checking `_medusa_jwt`
- Redirects unauthenticated/expired sessions to `/<locale>/login`
- Responds to `OPTIONS` requests with permissive CORS headers

## Data Access Layer

`src/lib/data/*` centralizes API calls and cache revalidation:

- `cart.ts`, `customer.ts`, `orders.ts`, `products.ts`, `wishlist.ts`, `reviews.ts`
- Uses `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in headers when required
- Revalidates cache via `revalidateTag` / `revalidatePath`

Medusa SDK setup:

- `src/lib/config.ts`
- base URL from `MEDUSA_BACKEND_URL`
- publishable key from `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

## Integration Points

- Medusa backend APIs (`store/*`, `auth/*`)
- Stripe (`NEXT_PUBLIC_STRIPE_KEY`)
- Algolia (`NEXT_PUBLIC_ALGOLIA_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`)
- OAuth initiation helpers for Google/Facebook/LINE

## Media and Image Loading

- Next image domains configured in `next.config.ts`
- Cloudflare image transformation loader in `src/lib/images/cloudflare-loader.ts`
- Optional image zone override via `NEXT_PUBLIC_CF_IMAGE_ZONE`

## Component Structure

- `src/components/atoms`
- `src/components/molecules`
- `src/components/organisms`
- `src/components/sections`
- `src/components/providers`

This layered structure separates base UI primitives from page-scale compositions.
