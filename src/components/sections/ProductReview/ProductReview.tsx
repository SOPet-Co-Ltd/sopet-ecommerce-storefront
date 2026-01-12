import { RenderStars } from "@/components/cells"
import { ReviewStats } from "@/lib/data/reviews"

const ProductReviewStars = ({ 
  averageRating, 
  totalReviews,
  soldCount = 0 
}: ReviewStats & { soldCount?: number }) => {
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
    <div className="grid grid-cols-[auto_1fr] gap-4 justify-center items-center">
      <div className="md:flex gap-2 hidden">
        <RenderStars averageRating={averageRating} size={24} />
      </div>
      <div className="flex gap-2 md:hidden">
        <RenderStars averageRating={averageRating} size={16} />
      </div>
      <div className="flex items-center gap-2">
        <p className="md:sop-body-lg-regular sop-body-sm-regular text-sop-neutral-gray-400">
          {averageRating} ({totalReviews} รีวิว)
        </p>
        <div className="w-px h-6 bg-sop-neutral-gray-400"> </div>
        <p className="md:sop-body-lg-regular sop-body-sm-regular text-sop-neutral-gray-400">
          ขายแล้ว {formatNumber(soldCount)} ชิ้น
        </p>
      </div>
    </div>
  )
}

export default ProductReviewStars
