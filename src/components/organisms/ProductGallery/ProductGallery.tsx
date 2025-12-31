import { ProductCarousel } from "@/components/cells"
import { HttpTypes } from "@medusajs/types"

export const ProductGallery = ({
  images,
}: {
  images: HttpTypes.StoreProduct["images"]
}) => {
  return (
    <div>
      <ProductCarousel slides={images} />
    </div>
  )
}
