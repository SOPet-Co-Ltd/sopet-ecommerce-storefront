import { getCustomerPaymentMethods } from "@/lib/data/customer"
import { NextResponse } from "next/server"

export async function GET() {
  const result = await getCustomerPaymentMethods()

  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : 400

    return NextResponse.json(
      {
        message: result.error,
        paymentMethods: [],
      },
      {
        status,
      }
    )
  }

  return NextResponse.json({
    paymentMethods: result.paymentMethods,
  })
}
