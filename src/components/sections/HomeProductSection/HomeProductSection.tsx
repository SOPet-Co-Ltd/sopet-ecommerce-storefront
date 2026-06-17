import { Button } from "@/components/atoms"
import { ProductCard } from "@/components/organisms"
import { RightArrowLineIcon } from "@/icons"
import {
  listProducts,
  getSectionProducts,
  type ProductSectionType,
  type ProductWithSeller,
} from "@/lib/data/products"
import { Product } from "@/types/product"
import Link from "next/link"
import { DEFAULT_REGION } from "@/lib/site-defaults"

export const HomeProductSection = async ({
  heading,
  locale = DEFAULT_REGION,
  sellerProducts = [],
  home = false,
  section,
  viewAllHref,
  excludeProductId,
}: {
  heading: string
  locale?: string
  sellerProducts?: Product[] | ProductWithSeller[]
  home?: boolean
  section?: ProductSectionType
  viewAllHref?: string
  /** When set (e.g. PDP), omit this product from the embedded seller list. */
  excludeProductId?: string
}) => {
  const sellerList = sellerProducts ?? []

  let products: ProductWithSeller[]

  if (section) {
    products = (
      await getSectionProducts({
        section,
        countryCode: locale,
        limit: section === "recommended" ? 25 : home ? 10 : 12,
        offset: 0,
      })
    ).products
  } else if (!home && sellerList.length === 0) {
    products = []
  } else if (!home && sellerList.length > 0) {
    const embedded = sellerList as ProductWithSeller[]
    const filtered = excludeProductId
      ? embedded.filter((p) => p.id !== excludeProductId)
      : embedded
    const ids = filtered.map((p) => p.id).filter(Boolean)
    if (ids.length === 0) {
      products = []
    } else {
      const { response } = await listProducts({
        countryCode: locale,
        pageParam: 1,
        queryParams: { id: ids, limit: ids.length },
        forceCache: true,
        includeStats: false,
      })
      const byId = new Map(response.products.map((p) => [p.id, p]))
      products = ids
        .map((id) => byId.get(id))
        .filter((p): p is ProductWithSeller => p != null)
    }
  } else {
    products = (
      await listProducts({
        countryCode: locale,
        queryParams: {
          limit: home ? 10 : undefined,
          order: "created_at",
          handle: home
            ? undefined
            : sellerList.map((product) => product.handle),
        },
        forceCache: !home,
        includeStats: false,
      })
    ).response.products
  }
  const href =
    viewAllHref ?? (section ? `/${locale}/products?section=${section}` : "#")
  const headingClass =
    section === "recommended"
      ? "lg:px-0 px-4 sop-body-lg-medium text-sop-neutral-gray-200 mb-5"
      : "md:px-0 md:mx-0 mx-4 md:sop-headline-md-medium sop-body-lg-medium text-sop-primary-500 mb-5 border-b border-sop-primary-500 pb-2"
  const showViewAllButton = section !== "recommended"

  return (
    <section className="w-full">
      <h2 className={headingClass}>{heading}</h2>
      <div className="flex gap-1 overflow-x-auto lg:grid md:grid-cols-5 md:gap-4 lg:px-0 px-4">
        {products.map((product) => (
          <div key={product.id} className="shrink-0 md:w-auto flex">
            <ProductCard api_product={product} product={product} />
          </div>
        ))}
      </div>
      {showViewAllButton && (
        <div className="flex justify-center items-center mt-6">
          {href && href !== "#" ? (
            <Link href={href}>
              <Button variant="secondary">
                <div className="px-4 flex items-center gap-2 py-2 md:py-0">
                  <p className="text-center">ดูทั้งหมด</p>
                  <RightArrowLineIcon size={11} color="#FF6F61" />
                </div>
              </Button>
            </Link>
          ) : (
            <Button variant="secondary">
              <div className="px-4 flex items-center gap-2 py-2 md:py-0">
                <p className="text-center">ดูทั้งหมด</p>
                <RightArrowLineIcon size={11} color="#FF6F61" />
              </div>
            </Button>
          )}
        </div>
      )}
      {/* <HomeProductsCarousel
        locale={locale}
        sellerProducts={products.slice(0, 4)}
        home={home}
      /> */}
    </section>
  )
}
