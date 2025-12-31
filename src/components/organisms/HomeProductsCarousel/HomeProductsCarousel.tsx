import { Carousel } from "@/components/cells"
import { ProductCardOld } from "../ProductCardOld/ProductCard"
import { listProducts } from "@/lib/data/products"
import { Product } from "@/types/product"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { getProductReviewStats, ReviewStats } from "@/lib/data/reviews"
import { SellerProps } from "@/types/seller"

export const HomeProductsCarousel = async ({
  locale,
  sellerProducts,
  home,
}: {
  locale: string
  sellerProducts: Product[]
  home: boolean
}) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode: locale,
    queryParams: {
      limit: home ? 4 : undefined,
      order: "created_at",
      handle: home
        ? undefined
        : sellerProducts.map((product) => product.handle),
    },
    forceCache: !home,
  })

  const productsWithRatingPromise: (HttpTypes.StoreProduct & {
    seller?: SellerProps
    reviewStats: ReviewStats
  })[] = await Promise.all(
    products.map(async (product) => {
      const reviewStats = await getProductReviewStats(product.id.toString())
      // console.log({ reviewStats });
      
      return { ...product, reviewStats }
    })
  )

  const sellerProductsWithRating = await Promise.all(
    sellerProducts.map(async (product) => {
      const reviewStats = await getProductReviewStats(product.id.toString())
      return { ...product, reviewStats }
    })
  )

  if (!productsWithRatingPromise.length && !sellerProducts.length) return null

  return (
    <div className="flex justify-center w-full">
      <Carousel
        align="start"
        items={(sellerProducts.length
          ? sellerProductsWithRating
          : productsWithRatingPromise
        ).map((product) => (
          <ProductCardOld
            key={product.id}
            product={product}
            api_product={
              home
                ? (product as HttpTypes.StoreProduct)
                : productsWithRatingPromise.find((p) => {
                    const { cheapestPrice } = getProductPrice({
                      product: p,
                    })
                    return (
                      cheapestPrice &&
                      p.id === product.id &&
                      Boolean(cheapestPrice)
                    )
                  })
            }
          />
        ))}
      />
    </div>
  )
}
