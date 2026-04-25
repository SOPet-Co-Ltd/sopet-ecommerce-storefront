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

## Checkout handoff contract (`transfer-to-medusa`)

Storefront checkout from the cart uses this backend bridge endpoint:

- `POST /store/customer-cart/transfer-to-medusa`
- Called by `transferCustomerCartItemsToMedusa()` in `src/lib/data/customer-cart.ts`.

### Request payload

```json
{
  "customer_cart_item_ids": ["cci_..."],
  "region_id": "reg_...",
  "sales_channel_id": "sc_...",
  "currency_code": "thb"
}
```

Notes:

- `customer_cart_item_ids` is required and must be non-empty.
- `region_id`, `sales_channel_id`, and `currency_code` are forwarded from the active Medusa cart context when available.
- On the storefront cart page, selected line-item IDs are customer-cart item IDs already, so they are passed directly.

### Success response

```json
{
  "medusa_cart_id": "cart_..."
}
```

Storefront then sets cart cookie with `medusa_cart_id` and redirects to checkout.

### Error response (400 contract)

Backend validation failures are expected to follow this machine-readable shape:

```json
{
  "code": "transfer_validation_failed",
  "message": "Human-readable actionable reason",
  "details": {}
}
```

Storefront behavior:

- Parses `code`, `message`, and optional `details` from backend error body.
- Logs safe debug context (`status`, `code`, `customerCartItemCount`, context-presence flags) without auth/token data.
- Re-throws normalized error so UI handlers can display a clear message.

### Deterministic preconditions expected by storefront

- Customer is authenticated for customer-cart endpoints.
- Selected customer cart items exist and are eligible for checkout transfer.
- Region/currency/sales channel context is resolvable for checkout handoff.
- Any backend item/stock/region validation failure should return the standardized 400 contract above.
