import type { CheckoutAddressFormData } from "@/components/molecules/AddressForm/schema"
import { checkoutAddressSchema } from "@/components/molecules/AddressForm/schema"
import { syncCheckoutShippingAddressToCart } from "@/lib/data/checkout-shipping-address"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    address?: CheckoutAddressFormData
  } | null

  const parsed = checkoutAddressSchema.safeParse(body?.address)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid shipping address" },
      { status: 400 }
    )
  }

  try {
    const cart = await syncCheckoutShippingAddressToCart(parsed.data)
    return NextResponse.json({ cart })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync shipping address"

    return NextResponse.json({ message }, { status: 400 })
  }
}
