import { StarIcon } from "@/icons"

export const StarRating = ({
  rate,
  starSize = 20,
  disabled,
}: {
  rate: number
  starSize?: number
  disabled?: boolean
}) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => {
        const starColor =
          i < Math.floor(rate)
            ? disabled
              ? "#9CA3AF"
              : "#FBBF24"
            : "#E5E7EB"
        return <StarIcon size={starSize} key={i} color={starColor} />
      })}
    </div>
  )
}
