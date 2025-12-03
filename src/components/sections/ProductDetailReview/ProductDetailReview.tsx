import { RenderStars } from "@/components/cells"
import {
  ProductDetailReviewComment,
  RenderReviewFilterButtons,
} from "@/components/sections"
import { getProductReviewStats } from "@/lib/data/reviews"
import { cn } from "@/lib/utils"

type ProductDetailReviewProps = {
  productId: string
}

export const ProductDetailReview = async ({
  productId,
}: ProductDetailReviewProps) => {
  const { averageRating, starCounts, totalReviews } =
    await getProductReviewStats(productId)

  const starCount5 = starCounts.find((s) => s.starCount === 5)?.count ?? 0
  const starCount4 = starCounts.find((s) => s.starCount === 4)?.count ?? 0
  const starCount3 = starCounts.find((s) => s.starCount === 3)?.count ?? 0
  const starCount2 = starCounts.find((s) => s.starCount === 2)?.count ?? 0
  const starCount1 = starCounts.find((s) => s.starCount === 1)?.count ?? 0

  return (
    <div className="bg-sop-base-white gap-4 p-4 md:rounded-lg rounded-none md:mt-5 mt-2">
      <div className="border-b mb-4 py-2 border-sop-primary-500">
        <p className="md:sop-headline-md-medium sop-body-lg-medium text-sop-primary-700">
          รีวิวจากลูกค้า
        </p>
      </div>
      <div className="grid md:grid-cols-[auto_1fr] p-2 md:grid-rows-1 grid-cols-1 grid-rows-[auto_auto] bg-sop-primary-100 rounded-lg md:gap-12 gap-4">
        {/* NOTE - Display stars and average stars */}
        <div className="flex lg:justify-between md:justify-center justify-start items-center md:flex-col gap-2 md:bg-transparent">
          <p className="sop-headline-md-medium md:sop-display-sm-medium text-sop-system-warning-500">
            {averageRating}
          </p>
          <div className="md:flex hidden items-center gap-2">
            <RenderStars averageRating={averageRating} size={25} />
          </div>
          <div className="flex md:hidden items-center gap-2">
            <RenderStars averageRating={averageRating} size={19} />
          </div>
        </div>
        {/* NOTE - Review display filter button */}
        <div className={cn("md:bg-transparent bg-sop-primary-100", "")}>
          <RenderReviewFilterButtons
            starCounts={{
              5: starCount5,
              4: starCount4,
              3: starCount3,
              2: starCount2,
              1: starCount1,
            }}
            totalReviews={totalReviews}
          />
        </div>
      </div>
      <ProductDetailReviewComment productId={productId} />
    </div>
  )
}
