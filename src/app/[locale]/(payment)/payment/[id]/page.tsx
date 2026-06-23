import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { getCheckoutSession } from "@/lib/data/checkout-session"
import { retrieveOrder } from "@/lib/data/orders"
import { listCartPaymentMethods } from "@/lib/data/payment"
import {
  isCardProviderId,
  isPromptpayProviderId,
} from "@/lib/helpers/marketplace-checkout-ui"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import PaymentPageClient from "./PaymentPageClient"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "payment",
    title: "ชำระเงิน",
    description: "หน้าชำระเงิน",
    indexable: false,
  })
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const sessionRes = await getCheckoutSession(id)
  if (!sessionRes.ok) {
    redirect(`/${locale}/checkout?error=payment_session_unavailable`)
  }

  const { session } = sessionRes

  // Validate order price (excluding shipping) before allowing payment
  const cart = session.payload.cart as {
    subtotal?: number | null
    discount_total?: number | null
  } | null
  if (cart) {
    const subtotal = typeof cart.subtotal === "number" ? cart.subtotal : 0
    const discountTotal =
      typeof cart.discount_total === "number" ? cart.discount_total : 0
    const orderPriceWithoutShipping = subtotal - discountTotal

    if (orderPriceWithoutShipping <= 0) {
      redirect(`/${locale}/checkout?error=invalid_order_price`)
    }
  }

  // Resolve provider IDs for the cart's region so the client can bootstrap
  // marketplace payment sessions on mount when no order exists yet.
  const paymentProviders = session.region_id
    ? await listCartPaymentMethods(session.region_id)
    : null

  const cardProviderId =
    paymentProviders?.find(
      (p) => isCardProviderId(p.id) && !isPromptpayProviderId(p.id)
    )?.id ??
    paymentProviders?.find((p) => isCardProviderId(p.id))?.id ??
    null
  const promptpayProviderId =
    paymentProviders?.find((p) => isPromptpayProviderId(p.id))?.id ?? null

  const providerId =
    session.payment_method === "promptpay"
      ? promptpayProviderId
      : cardProviderId

  // Fetch the fresh order if we already have one (refresh case).
  const order = session.order_id
    ? await retrieveOrder(session.order_id, {
        checkoutSessionId: session.id,
      }).catch(() => null)
    : null

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-4">
      <PaymentPageClient
        locale={locale}
        session={session}
        order={order}
        providerId={providerId}
      />
    </main>
  )
}
