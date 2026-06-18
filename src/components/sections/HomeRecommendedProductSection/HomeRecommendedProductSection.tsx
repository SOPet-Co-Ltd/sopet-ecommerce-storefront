import { ProductCard } from "@/components/organisms"
import { getSectionProducts } from "@/lib/data/products"
import { DEFAULT_REGION } from "@/lib/site-defaults"

export const HomeRecommendedProductSection = async ({
  heading,
  locale = DEFAULT_REGION,
}: {
  heading: string
  locale?: string
}) => {
  const products = (
    await getSectionProducts({
      section: "recommended",
      countryCode: locale,
      limit: 25,
      offset: 0,
    })
  ).products

  return (
    <section className="w-full">
      <h2 className="mb-5 sop-body-lg-medium text-sop-neutral-gray-200">
        {heading}
      </h2>
      <div className="w-full">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-2 justify-items-center md:grid-cols-[repeat(auto-fit,minmax(223px,1fr))] md:gap-4">
          {products.map((product) => (
            <ProductCard
              api_product={product}
              key={product.id}
              product={product}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
