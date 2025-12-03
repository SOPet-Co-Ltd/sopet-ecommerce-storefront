import { Button } from "@/components/atoms"
import { ProductCard } from "@/components/organisms"
import { RightArrowLineIcon } from "@/icons"
import { listProducts } from "@/lib/data/products"
import { Product } from "@/types/product"

export const HomeProductSection = async ({
  heading,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || "pl",
  sellerProducts = [],
  home = false,
}: {
  heading: string
  locale?: string
  sellerProducts?: Product[]
  home?: boolean
}) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode: locale,
    queryParams: {
      limit: home ? 10 : undefined,
      order: "created_at",
      handle: home
        ? undefined
        : sellerProducts.map((product) => product.handle),
    },
    forceCache: !home,
  })
  return (
    <section className="w-full">
      <h2 className="px-4 md:sop-headline-md-medium sop-body-lg-medium text-sop-primary-700 mb-5">
        {heading}
      </h2>
      <div className="flex gap-1 overflow-x-auto lg:grid md:grid-cols-5 md:gap-4 lg:px-0 px-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 md:w-auto flex"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center mt-6">
        <Button variant="secondary">
          <div className="px-4 flex items-center gap-2 py-2 md:py-0">
            <p className="text-center">ดูทั้งหมด</p>
            <RightArrowLineIcon size={11} color="#FF6F61" />
          </div>
        </Button>
      </div>
      {/* <HomeProductsCarousel
        locale={locale}
        sellerProducts={products.slice(0, 4)}
        home={home}
      /> */}
    </section>
  )
}
