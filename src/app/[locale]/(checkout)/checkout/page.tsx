import CheckoutAddressForm from "@/components/molecules/CheckoutAddressForm/CheckoutAddressForm"
import CheckoutDetailsSection from "@/components/molecules/CheckoutDetailsSection/CheckoutDetailsSection"
import CheckoutPaymentSelection from "@/components/molecules/CheckoutPaymentSelection/CheckoutPaymentSelection"
import CheckoutSummarySection from "@/components/molecules/CheckoutSummarySection/CheckoutSummarySection"
import { CheckoutMobileBottomBar } from "@/components/molecules/CheckoutSummarySection/CheckoutMobileBottomBar"
import { CheckoutPromotionSection } from "@/components/sections/CheckoutPromotionSection"
import { CheckoutStoreProvider } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { retrieveCart } from "@/lib/data/cart"
import { getCheckoutPageInitialData } from "@/lib/data/checkout-page"
import { getCheckoutCustomer } from "@/lib/data/customer"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "checkout",
    title: "ชำระเงิน",
    description:
      "กรอกที่อยู่จัดส่ง เลือกวิธีชำระเงิน และยืนยันคำสั่งซื้อของคุณอย่างปลอดภัย",
    indexable: false,
  })
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Kick the customer fetch off in parallel — `getCheckoutPageInitialData`
  // awaits the same promise so we don't double-fetch.
  const customerPromise = getCheckoutCustomer()
  const cart = await retrieveCart()

  if (!cart) {
    redirect(`/${locale}/cart?checkout=unavailable`)
  }

  const regionId = cart.region_id ?? cart.region?.id ?? null
  const initialData = await getCheckoutPageInitialData(cart.id, regionId, {
    customerPromise,
  })

  return (
    <main>
      <CheckoutStoreProvider
        cart={cart}
        customer={initialData.customer}
        customerAddresses={initialData.customer?.addresses ?? []}
        customerCards={initialData.customerCards}
        shippingMethods={initialData.shippingMethods}
        paymentMethods={initialData.paymentMethods}
        sitePromos={initialData.sitePromos}
        vendorPromos={initialData.vendorPromos}
        error={initialData.error}
      >
        <div className="lg:px-16 px-sop-16px lg:py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-8 xl:flex-row">
            <div className="flex-1 xl:min-w-112.5">
              <CheckoutAddressForm customer={initialData.customer} />
              <CheckoutDetailsSection
                cart={cart}
                vendorPromos={initialData.vendorPromos}
              />
            </div>

            <div className="w-full xl:max-w-105 lg:mt-17 sm:mt-sop-16px">
              <CheckoutPromotionSection />
              <CheckoutPaymentSelection
                payment={initialData.customerCards}
                paymentMethods={initialData.paymentMethods}
              />
              <CheckoutSummarySection customer={initialData.customer} />
            </div>
          </div>
        </div>
        <CheckoutMobileBottomBar />
      </CheckoutStoreProvider>
    </main>
  )
}
