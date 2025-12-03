import { type ProductReview } from "@/lib/data/reviews"
import Image from "next/image"
import { RenderStars } from "@/components/cells"

type ProductDetailReviewUserCommentProps = {
  review: ProductReview
}

function maskMiddle(input: string): string {
  if (input.length <= 2) return input // nothing to mask if too short

  const middle = "*".repeat(input.length - 2)
  return input[0] + middle + input[input.length - 1]
}

export const ProductDetailReviewUserComment = ({
  review,
}: ProductDetailReviewUserCommentProps) => {
  return (
    <div className="border-b pb-4 border-sop-neutral-gray-300">
      {/* NOTE - Review header (reviewer info, rating, date) */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-2">
        <div className="p-2">
          <Image
            src={
              review.customer?.image ||
              "/images/customers/customer-placeholder.svg"
            }
            alt={review.customer?.name || "Customer Avatar"}
            width={33}
            height={33}
            className="rounded-full"
          />
        </div>
        <div className="">
          <div>
            <p className="md:sop-body-sm-regular">
              {(review.customer?.name && maskMiddle(review.customer.name)) ||
                "ลูกค้าผู้ไม่ประสงค์ออกนาม"}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1">
              <RenderStars averageRating={review.rating} size={18} />
            </div>
            <div className="w-px md:h-6 h-4 bg-sop-neutral-gray-400"></div>
            <div>
              <p className="text-sop-neutral-gray-400">
                {new Date(review.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* NOTE - Review content */}
      <div>
        <p className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-300">
          {review.comment}
        </p>
      </div>
      {/* NOTE - Review images */}
      <div>
        <div className="flex gap-2 mt-2">
          {review.images &&
            review.images.length > 0 &&
            review.images.map((imgUrl, index) => (
              <div key={index} className="w-20 h-20 relative shrink-0">
                <Image
                  src={imgUrl}
                  alt={`Review image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
