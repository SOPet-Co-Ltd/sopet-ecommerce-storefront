import { ProductCard } from "@/components/organisms"
import { getRecentOrderProducts } from "@/lib/data/recent-orders"

export const HomeRecentOrdersSection = async ({
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || "en",
}: {
  locale?: string
}) => {
  const products = await getRecentOrderProducts({ countryCode: locale })

  // Only render section if customer has recent order products
  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      <h2 className="mb-5 sop-body-lg-medium text-sop-neutral-gray-200">
        ซื้อล่าสุด
      </h2>
      <div className="w-full overflow-x-auto">
        <ul className="flex gap-3 lg:gap-4 pb-2 min-w-max">
          {products.map((product) => (
            <li
              key={product.id}
              style={{
                zoom: 0.6,
              }}
            >
              <ProductCard api_product={product} product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
