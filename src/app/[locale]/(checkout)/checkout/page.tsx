import CheckoutAddressForm from "@/components/molecules/CheckoutAddressForm/CheckoutAddressForm"
import CheckoutDetailsSection from "@/components/molecules/CheckoutDetailsSection/CheckoutDetailsSection"
import CheckoutPaymentSelection from "@/components/molecules/CheckoutPaymentSelection/CheckoutPaymentSelection"
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
    <main className="lg:px-16 px-sop-16px lg:py-4 flex flex-col gap-4">
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
        <div className="flex xl:flex-row lg:flex-row md:flex-row flex-col gap-8">
          <div className="w-full">
            <CheckoutAddressForm customer={initialData.customer} />
            <CheckoutDetailsSection
              cart={cart}
              vendorPromos={initialData.vendorPromos}
            />
          </div>
          <div className="lg:mt-17 sm:mt-sop-16px  w-full">
            <CheckoutPaymentSelection
              payment={initialData.customerCards}
              paymentMethods={initialData.paymentMethods}
            />
          </div>
        </div>

        <pre className="text-xs whitespace-pre-wrap break-all">
          {JSON.stringify(
            {
              // cart,
              // customer: initialData.customer,
              customerCards: initialData.customerCards,
              // sitePromos: initialData.sitePromos,
              // vendorPromos: initialData.vendorPromos,
              // shippingMethods: initialData.shippingMethods,
              paymentMethods: initialData.paymentMethods,
              // error: initialData.error,
            },
            null,
            2
          )}
        </pre>
      </CheckoutStoreProvider>
    </main>
  )
}
