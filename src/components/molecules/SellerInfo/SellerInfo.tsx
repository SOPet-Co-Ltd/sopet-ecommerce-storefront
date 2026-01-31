import { StarRating } from "@/components/atoms"
import { SellerAvatar } from "@/components/cells/SellerAvatar/SellerAvatar"
import { SellerProps } from "@/types/seller"
import { SellerReview } from "../SellerReview/SellerReview"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"

export const SellerInfo = ({
  seller,
  header = false,
}: {
  seller: SellerProps
  header?: boolean
}) => {
  const { photo, name, reviews } = seller

  const validReviews = reviews?.filter((rev) => rev !== null) || []
  const reviewCount = validReviews.length
  const rating =
    reviewCount > 0
      ? validReviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviewCount
      : 0

  return (
    <div className="flex justify-between items-center w-full">
      <LocalizedClientLink href={`/sellers/${seller.handle}`}>
        <div className="flex items-center gap-4">
          <div className="border rounded-full md:block hidden">
            <SellerAvatar photo={photo} size={50} alt={name} />
          </div>
          <div className="border rounded-full block md:hidden">
            <SellerAvatar photo={photo} size={33} alt={name} />
          </div>
          <p className="md:sop-headline-sm-regular sop-body-sm-regular">
            {name}
          </p>
        </div>
      </LocalizedClientLink>
      <LocalizedClientLink href={`/sellers/${seller.handle}`}>
        <div className="">
          <p className="sop-body-xs-regular md:sop-body-md-regular py-1 md:px-8 px-4 border rounded-full border-sop-secondary-500 text-sop-secondary-500">
            ดูร้านค้า
          </p>
        </div>
      </LocalizedClientLink>
      {/* <div className="relative h-12 w-12 overflow-hidden rounded-xs">
        <SellerAvatar photo={photo} size={56} alt={name} />
      </div>
      <div className="w-[90%]">
        <h3 className="heading-sm text-primary">{name}</h3>
        <div className="flex items-center gap-2 border-b pb-4">
          <StarRating starSize={16} rate={rating || 0} />
          <span className="text-md text-secondary">{reviewCount} reviews</span>
        </div>
        {!header && validReviews.length > 0 && (
          <div className="mt-4">
            {validReviews.slice(-3).map((review) => (
              <SellerReview key={review.id} review={review} />
            ))}
          </div>
        )}
      </div> */}
    </div>
  )
}
