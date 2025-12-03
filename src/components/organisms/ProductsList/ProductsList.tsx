import { ProductCardOld } from "../ProductCardOld/ProductCard"
import { HttpTypes } from "@medusajs/types"

export const ProductsList = ({
  products,
}: {
  products: HttpTypes.StoreProduct[]
}) => {
  return (
    <>
      {products.map((product) => (
        <ProductCardOld key={product.id} product={product} api_product={product} />
      ))}
    </>
  )
}
