# Google Analytics 4 Integration

This directory contains the Google Analytics 4 (GA4) integration for tracking e-commerce events and user behavior.

**Note:** GA4 only loads in production mode (`NODE_ENV=production`). This prevents development traffic from polluting your analytics data.

## Setup

1. **Add your GA4 Measurement ID to environment variables:**

```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

2. **The GA4 script is automatically loaded** in `src/app/layout.tsx` using `@next/third-parties/google`

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
- `trackPageView` - Page view (usually automatic)

## Implementation Checklist

### Home Page

- [ ] Track featured products view (`trackViewItemList`)
- [ ] Track product clicks (`trackSelectItem`)

### Product Listing Page

- [ ] Track product list view (`trackViewItemList`)
- [ ] Track product clicks (`trackSelectItem`)
- [ ] Track search queries (`trackSearch`)

### Product Detail Page

- [ ] Track product view (`trackViewItem`)
- [ ] Track add to cart (`trackAddToCart`)

### Cart Page

- [ ] Track cart view (`trackViewCart`)
- [ ] Track remove from cart (`trackRemoveFromCart`)
- [ ] Track begin checkout (`trackBeginCheckout`)

### Checkout Flow

- [ ] Track begin checkout (`trackBeginCheckout`)
- [ ] Track add shipping info (`trackAddShippingInfo`)
- [ ] Track add payment info (`trackAddPaymentInfo`)
- [ ] Track purchase (`trackPurchase`)

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

**Important:** GA4 is disabled in development mode. To test, you need to run in production mode:

```bash
# Build and run in production mode
npm run build
npm run start
```

Then:

1. Open your website in browser
2. Open Developer Console
3. Type `window.gtag` - should return a function (if undefined, GA4 didn't load)
4. Perform actions (view product, add to cart, etc.)
5. Check GA4 DebugView in Google Analytics (enable debug mode: `?ga_debug=1` in URL)

### Development Testing

If you need to test in development temporarily, you can modify `src/app/layout.tsx`:

```tsx
// Find this line (around line 92):
const isProduction = process.env.NODE_ENV === "production"

// Change to:
const isProduction = true // Force GA4 in development (for testing only)
```

**Don't forget to revert this change after testing!**

## Files

- `gtag.ts` - Core GA4 event tracking functions
- `useAnalytics.ts` - React hook for tracking in components
- `helpers.ts` - Helper functions to convert Medusa data to GA4 format
- `index.ts` - Public exports

## Resources

- [GA4 E-commerce Events Documentation](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Next.js Third Parties Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-analytics)
