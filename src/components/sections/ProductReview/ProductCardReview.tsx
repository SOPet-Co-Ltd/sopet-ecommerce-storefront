import { RenderStars } from "@/components/cells"
import { StarIcon } from "@/icons"
import { ReviewStats } from "@/lib/data/reviews"

export const ProductCardReviewStars = ({
  averageRating,
  totalReviews,
  soldCount = 0,
}: ReviewStats & { soldCount?: number }) => {
  const amountSaled = soldCount

  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString()

    const units = ["", "K", "M", "B", "T"]
    const magnitude = Math.floor(Math.log10(num) / 3)
    const scaled = num / Math.pow(1000, magnitude)

    // Avoid showing `.0` for whole numbers
    const formatted = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)

    return `${formatted}${units[magnitude]}`
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-1 justify-center items-center">
      <div className="md:flex gap-2 hidden">
        <StarIcon color="#ffb514" size={16} />
      </div>
      <div className="flex gap-2 md:hidden">
        <StarIcon color="#ffb514" size={14} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="md:sop-body-sm-regular sop-body-xs-regular text-sop-neutral-gray-400">
          {averageRating} ({totalReviews} รีวิว)
        </p>
        <p className="md:sop-body-xs-regular sop-body-xs-regular text-sop-neutral-gray-400">
          ขายแล้ว {formatNumber(amountSaled)} ชิ้น
        </p>
      </div>
    </div>
  )
}
