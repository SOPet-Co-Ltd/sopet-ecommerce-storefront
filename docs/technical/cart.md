# Cart behavior

## Anonymous vs customer cart

- **Anonymous cart (local)**:
  - Stored in `localStorage` under the key `sopet_customer_cart_anonymous_v1`.
  - Managed by `src/lib/data/local-customer-cart.ts`.
  - Uses `AnonymousCartItemInput` items (product, variant, quantity, optional price snapshot, source, metadata).

- **Customer cart (server)**:
  - Backed by the `customer_cart` and `customer_cart_item` tables in the backend.
  - Exposed via `/store/customer-cart` and `/store/customer-cart/items`.
  - Client integration lives in `src/lib/data/customer-cart.ts` and `src/lib/data/customer-cart-page.ts`.

## Merge on sign-in

When a customer signs in, we merge their **local anonymous cart** into their **customer cart** using the `/store/customer-cart/merge-anonymous` endpoint.

- **Trigger point**:
  - Immediately after successful OAuth sign-in on the `auth/oauth-success` page.
  - The client component `OAuthSuccessView` calls
    `mergeAnonymousCartIntoCustomerAfterLogin()` from
    `src/lib/data/local-customer-cart.ts`.

- **What gets sent**:
  - The raw anonymous items from `getAnonymousCart()` are posted as:
    - `POST /store/customer-cart/merge-anonymous { items: AnonymousCartItemInput[] }`
  - The request includes `credentials: "include"` so the backend can associate
    the merge with the authenticated customer.

- **Merge behavior (server vs local)**:
  - The backend matches items by **product_id + variant_id only** (no duplicates for the same variant).
  - Previous rules (replaced):
    - If a matching item already exists in the customer cart (same product,
      variant, unit price snapshot, source, and metadata), **the existing
      customer-cart quantity wins**. The local quantity is **ignored** and the
      existing row is left unchanged.
    - If there is **no** matching item, a new `customer_cart_item` row is
      created with the anonymous item’s quantity and attributes.
  - Anonymous items are first aggregated by the same composite key used for
    matching, so multiple identical anonymous lines become a single create with
    summed quantity.

- **Reliability**:
  - The merge helper retries once after a short delay if the first attempt
    fails or returns `merged: false` (e.g. auth cookie not yet available
    after OAuth redirect).
  - OAuth success view waits a short delay before calling merge so the auth
    cookie is available.
- **Local cart cleanup**:
  - The local anonymous cart is cleared **only if** the merge request succeeds
    (`merged: true`). On failure or non-2xx we do not clear the local cart.

## Adding new sign-in flows

If you add another sign-in success screen (non-OAuth), reuse the same helper:

- From a client component that runs after successful login, call:
  - `await mergeAnonymousCartIntoCustomerAfterLogin()`
- This keeps merge behavior and conflict rules consistent across all auth flows.
