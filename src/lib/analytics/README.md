# Google Tag Manager & GA4 Analytics

This directory contains GTM-based analytics for tracking e-commerce events and user behavior. Events are pushed to `window.dataLayer` and forwarded to GA4 (and other tags) via the GTM container.

**Note:** GTM only loads in production mode (`NODE_ENV=production`). This prevents development traffic from polluting your analytics data.

## Setup

### 1. Storefront environment variable

```bash
# .env.local or deployment env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

GA4 Measurement ID (`G-XXXXXXXX`) is **not** set in the app — configure it inside the GTM container (see below).

### 2. GTM container loads automatically

`src/app/layout.tsx` loads the container via `@next/third-parties/google` (`GoogleTagManager`).

Client-side route changes are tracked by `src/components/GTMPageViewTracker.tsx`.

## GTM container configuration

Configure these in [Google Tag Manager](https://tagmanager.google.com). Without this, the container loads but GA4 reports stay empty.

### GA4 Configuration tag

1. **Tags → New → Google Analytics: GA4 Configuration**
2. Measurement ID: `G-XXXXXXXX`
3. Trigger: **Initialization - All Pages**
4. Save

### GA4 Event tags (e-commerce)

For each dataLayer event the app pushes, create a **GA4 Event** tag with a **Custom Event** trigger:

| dataLayer `event`  | Trigger (Custom Event) | Event parameters                                           |
| ------------------ | ---------------------- | ---------------------------------------------------------- |
| `page_view`        | `page_view`            | `page_path`, `page_location`                               |
| `view_item`        | `view_item`            | `ecommerce.items`, `ecommerce.value`, `ecommerce.currency` |
| `add_to_cart`      | `add_to_cart`          | same as above                                              |
| `view_cart`        | `view_cart`            | same as above                                              |
| `begin_checkout`   | `begin_checkout`       | same as above                                              |
| `purchase`         | `purchase`             | + `ecommerce.transaction_id`                               |
| `remove_from_cart` | `remove_from_cart`     | same as above                                              |
| `search`           | `search`               | `search_term`                                              |
| `scroll`           | `scroll`               | `percent_scrolled`                                         |
| `click`            | `click`                | `link_url`, `link_text`, `outbound`                        |

**Data Layer Variables** (Variables → New → Data Layer Variable):

- `ecommerce.items` → Data Layer Variable Name: `ecommerce.items`
- `ecommerce.value` → Data Layer Variable Name: `ecommerce.value`
- `ecommerce.currency` → Data Layer Variable Name: `ecommerce.currency`
- `ecommerce.transaction_id` → Data Layer Variable Name: `ecommerce.transaction_id`
- `search_term` → Data Layer Variable Name: `search_term`
- `percent_scrolled` → Data Layer Variable Name: `percent_scrolled`
- `link_url` → Data Layer Variable Name: `link_url`
- `link_text` → Data Layer Variable Name: `link_text`
- `outbound` → Data Layer Variable Name: `outbound`

Map these variables in each GA4 Event tag under **Event Parameters**.

### Publish and verify

1. **Submit** and publish the container
2. [Tag Assistant](https://tagassistant.google.com/) — confirm container loads, no duplicate GA4 tags
3. GA4 **Admin → DebugView** — confirm events appear when browsing the site

## Usage

### In React Components

```tsx
import { useAnalytics } from "@/lib/analytics"

function ProductCard({ product }) {
  const { trackAddToCart, trackViewItem } = useAnalytics()

  const handleAddToCart = () => {
    trackAddToCart({
      currency: "THB",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: 1,
        },
      ],
    })
  }

  return <button onClick={handleAddToCart}>Add to Cart</button>
}
```

### Helper Functions for Medusa Products

```tsx
import { useAnalytics } from "@/lib/analytics"
import {
  convertProductToGA4Item,
  calculateTotalValue,
} from "@/lib/analytics/helpers"

function ProductPage({ product }) {
  const { trackViewItem } = useAnalytics()

  useEffect(() => {
    const item = convertProductToGA4Item(product)
    trackViewItem({
      currency: item.currency,
      value: item.price,
      items: [item],
    })
  }, [product])
}
```

## Available Events

### E-commerce Events

| Event                  | Description             | When to Use                           |
| ---------------------- | ----------------------- | ------------------------------------- |
| `trackViewItemList`    | Product list viewed     | Product listing pages, search results |
| `trackViewItem`        | Product detail viewed   | Product detail page                   |
| `trackSelectItem`      | Product clicked in list | When user clicks product card         |
| `trackAddToCart`       | Item added to cart      | Add to cart button clicked            |
| `trackRemoveFromCart`  | Item removed from cart  | Remove from cart button clicked       |
| `trackViewCart`        | Cart viewed             | Cart page or cart drawer opened       |
| `trackBeginCheckout`   | Checkout started        | Checkout button clicked               |
| `trackAddShippingInfo` | Shipping info added     | Shipping form submitted               |
| `trackAddPaymentInfo`  | Payment info added      | Payment form submitted                |
| `trackPurchase`        | Purchase completed      | Order confirmation page               |

### Other Events

- `trackSearch` - Search performed
- `trackEvent` - Custom event
- `trackPageView` - Page view (SPA navigations via `GTMPageViewTracker`)

### Currently wired in the app

| Event              | Location                                 |
| ------------------ | ---------------------------------------- |
| `page_view`        | `GTMPageViewTracker` (SPA navigations)   |
| `view_item`        | `ProductViewTracker` (PDP)               |
| `add_to_cart`      | `ProductDetailsHeader`                   |
| `view_cart`        | `CartPageClient`                         |
| `remove_from_cart` | `CartPageClient` (item delete)           |
| `begin_checkout`   | `CheckoutTracker`                        |
| `purchase`         | `OrderPurchaseTracker` (order confirmed) |
| `search`           | `AlgoliaProductsListing` (`query` param) |
| `scroll`           | `AnalyticsBehaviorTracker` (site-wide)   |
| `click` (outbound) | `AnalyticsBehaviorTracker` (site-wide)   |

## GA4 Item Format

All e-commerce events use the `GA4Item` interface:

```typescript
interface GA4Item {
  item_id: string // Required: Product ID
  item_name: string // Required: Product name
  currency?: string // "THB", "USD", etc.
  price?: number // Unit price
  quantity?: number // Item quantity
  item_category?: string // Main category
  item_category2?: string // Subcategory
  item_brand?: string // Brand or collection
  item_variant?: string // Product variant (size, color, etc.)
}
```

## Best Practices

1. **Always include currency and value** for e-commerce events
2. **Use helper functions** to convert Medusa data to GA4 format
3. **Track at the right moment** - e.g., track add-to-cart when the action succeeds, not when button is clicked
4. **Include product categories** when available for better insights
5. **Use transaction_id** for purchase events (order ID)

## Testing

GTM is disabled in development mode. To test, run in production mode:

```bash
NEXT_PUBLIC_GTM_ID=GTM-XXXX yarn build && yarn start
```

Then:

1. Open [Tag Assistant](https://tagassistant.google.com/) and connect to your site
2. Open Developer Console — type `dataLayer` to inspect pushed events
3. Walk the funnel: search → PDP → add to cart → cart → remove item → checkout → order confirmed
4. Scroll a page and click an external link — confirm `scroll` and `click` events in `dataLayer`
5. Confirm events in GA4 **DebugView** (GTM preview mode or published container)
6. Confirm only one GA4 path (via GTM) — no duplicate `collect` requests from a direct GA4 script

## Files

- `gtag.ts` - dataLayer push functions (GA4 ecommerce format)
- `useAnalytics.ts` - React hook for tracking in components
- `helpers.ts` - Helper functions to convert Medusa/cart/order data to GA4 format
- `index.ts` - Public exports
- `../components/GTMPageViewTracker.tsx` - SPA page view tracking
- `../components/AnalyticsBehaviorTracker.tsx` - Scroll depth and outbound link tracking
- `../components/atoms/OrderPurchaseTracker/OrderPurchaseTracker.tsx` - Purchase event on order confirmation

## Resources

- [GA4 E-commerce (GTM dataLayer)](https://developers.google.com/tag-platform/tag-manager/ecommerce-ga4)
- [Next.js GTM Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-tag-manager)
