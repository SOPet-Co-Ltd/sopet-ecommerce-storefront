import PromptPayPendingPageClient from "@/components/sections/CheckoutPaymentSection/PromptPayPendingPageClient"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { CheckoutElementsSecretProvider } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { MarketplaceCheckoutProvider } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "checkout/promptpay",
    title: "ชำระเงิน PromptPay",
    description: "สแกน QR Code เพื่อชำระเงิน",
    indexable: false,
  })
}

export default function CheckoutPromptPayPage() {
  return (
    <CheckoutElementsSecretProvider>
      <MarketplaceCheckoutProvider>
        <main className="lg:px-16 px-0 lg:py-4 flex flex-col gap-4">
          <PromptPayPendingPageClient />
        </main>
      </MarketplaceCheckoutProvider>
    </CheckoutElementsSecretProvider>
  )
}
