import { ProductCard } from "../ProductCard/ProductCard"
import { HttpTypes } from "@medusajs/types"

export const ProductsList = ({
  products,
}: {
  products: HttpTypes.StoreProduct[]
}) => {
  return (
    <>
      {products.map((product) => (
        <ProductCard
          api_product={products?.find((p: any) => p.id === product.id)}
          key={product.id}
          product={product}
        />
      ))}
    </>
  )
}
