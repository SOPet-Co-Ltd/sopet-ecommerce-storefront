import { loadStripe, type Stripe } from "@stripe/stripe-js"

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_KEY

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Single shared Stripe.js loader for the storefront (checkout boundary, card forms).
 */
export function getStripePublishableKey(): string | undefined {
  return publishableKey
}

export function getStripePromise(): Promise<Stripe | null> | null {
  if (!publishableKey) {
    return null
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}
