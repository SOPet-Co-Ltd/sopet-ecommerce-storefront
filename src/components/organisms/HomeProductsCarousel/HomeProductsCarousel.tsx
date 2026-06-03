import { Carousel } from "@/components/cells"
import { ProductCardOld } from "../ProductCardOld/ProductCard"
import { listProducts } from "@/lib/data/products"
import { Product } from "@/types/product"
import { getProductPrice } from "@/lib/helpers/get-product-price"

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
    includeStats: false,
  })

  const cardProducts = sellerProducts.length ? sellerProducts : products

  if (!products.length && !sellerProducts.length) return null

  return (
    <div className="flex justify-center w-full">
      <Carousel
        align="start"
        items={cardProducts.map((product) => (
          <ProductCardOld
            key={product.id}
            product={product}
            api_product={
              home
                ? products.find((p) => p.id === String(product.id))
                : products.find((p) => {
                    const { cheapestPrice } = getProductPrice({
                      product: p,
                    })
                    return (
                      cheapestPrice &&
                      p.id === String(product.id) &&
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
