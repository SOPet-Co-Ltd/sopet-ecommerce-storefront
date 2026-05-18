import { Button } from "@/components/atoms"
import CheckoutAddressForm from "@/components/molecules/CheckoutAddressForm/CheckoutAddressForm"
import CheckoutDetailsSection from "@/components/molecules/CheckoutDetailsSection/CheckoutDetailsSection"
import CheckoutPaymentSelection from "@/components/molecules/CheckoutPaymentSelection/CheckoutPaymentSelection"
import CheckoutSummarySection from "@/components/molecules/CheckoutSummarySection/CheckoutSummarySection"
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
          <div className="flex xl:flex-row lg:flex-row md:flex-row flex-col gap-8">
            <div className="w-full">
              <CheckoutAddressForm customer={initialData.customer} />
              <CheckoutDetailsSection
                cart={cart}
                vendorPromos={initialData.vendorPromos}
              />
            </div>
            <div className="lg:mt-17 sm:mt-sop-16px w-full">
              <CheckoutPaymentSelection
                payment={initialData.customerCards}
                paymentMethods={initialData.paymentMethods}
              />
              <CheckoutSummarySection
                cart={cart}
                customer={initialData.customer}
                sitePromos={initialData.sitePromos}
                vendorPromos={initialData.vendorPromos}
              />
            </div>
          </div>

          {/* <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(
              {
                cart,
                customer: initialData.customer,
                customerCards: initialData.customerCards,
                sitePromos: initialData.sitePromos,
                vendorPromos: initialData.vendorPromos,
                shippingMethods: initialData.shippingMethods,
                paymentMethods: initialData.paymentMethods,
                error: initialData.error,
              },
              null,
              2
            )}
          </pre> */}
        </div>
        <div className="block lg:hidden">
          <div className=" px-sop-32px py-sop-12px rounded-tl-sop-20px rounded-tr-sop-20px bg-sop-base-white flex justify-between items-center mt-14">
            <div className="flex flex-col ">
              <label className="sop-body-sm-medium text-sop-neutral-gray-300">
                ยอดชำระเงิน
              </label>
              <label className="text-sop-secondary-600">
                ฿{cart.total.toFixed(2)}
              </label>
            </div>
            <Button className="w-fit" variant="primary" size="lg" type="submit">
              ชำระเงิน
            </Button>
          </div>
        </div>
      </CheckoutStoreProvider>
    </main>
  )
}
