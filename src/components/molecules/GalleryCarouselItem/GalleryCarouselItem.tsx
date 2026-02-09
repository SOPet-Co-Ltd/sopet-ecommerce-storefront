import { SingleProductImage } from "@/types/product"
import SmartImage from "@/components/atoms/SmartImage/SmartImage"

export const GalleryCarouselItem = ({
  image,
}: {
  image: SingleProductImage
}) => {
  return (
    <SmartImage
      key={image.id}
      src={decodeURIComponent(image.url)}
      alt={image.alt}
      width={700}
      height={700}
    />
  )
}
