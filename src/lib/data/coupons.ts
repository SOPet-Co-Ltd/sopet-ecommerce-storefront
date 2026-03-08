const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export type CouponApiData = {
  id: string
  code: string
  title: string
  description: string
  conditions: string | null
  category: string // "new_customer" | "shipping" | "special"
  discount_value: string
  min_purchase: string | null
  expiry_date: string
  image_color: string | null
  status: string
}

/**
 * Fetch coupons from the backend API.
 * @param category Optional category filter: "new_customer" | "shipping" | "special"
 */
export async function fetchCoupons(
  category?: string
): Promise<CouponApiData[]> {
  try {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/coupons`)
    if (category) {
      url.searchParams.set("category", category)
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const res = await fetch(url.toString(), {
      headers: {
        "x-publishable-api-key": publishableKey,
      },
      next: { revalidate: 60 }, // revalidate every 60 seconds
    })

    if (!res.ok) {
      console.error(`Failed to fetch coupons: ${res.status}`)
      return []
    }

    const data = await res.json()
    return data.coupons || []
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return []
  }
}

/**
 * Map API coupon data to the format used by CouponCard component.
 */
export function mapCouponToCardData(coupon: CouponApiData) {
  // Map category to display labels
  const categoryLabels: Record<string, { top: string; bottom: string }> = {
    new_customer: { top: "New User", bottom: "เฉพาะลูกค้าใหม่" },
    shipping: { top: "จัดส่งฟรี", bottom: "" },
    special: { top: "ส่วนลดพิเศษ", bottom: "" },
  }

  const labels = categoryLabels[coupon.category] || {
    top: "",
    bottom: "",
  }

  return {
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    expiry: coupon.expiry_date,
    conditionsUrl: "#",
    conditions: coupon.conditions,
    leftTextTop: labels.top,
    leftTextBottom: labels.bottom,
    imageColor: coupon.image_color || undefined,
  }
}
