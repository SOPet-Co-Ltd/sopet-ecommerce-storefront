import { StarIcon } from "@/icons"

export const RenderStars = ({
  averageRating,
  size = 24,
}: {
  averageRating: number
  size?: number
}) => {
  const stars = []
  const fullStars = Math.floor(averageRating)
  const partialFill = (averageRating - fullStars) * 100 // Get percentage for partial star

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      // Full star
      stars.push(<StarIcon key={i} color="#ffb514" size={size} />)
    } else if (i === fullStars && partialFill > 0) {
      // Partial star
      stars.push(
        <div key={i} className="relative inline-block">
          {/* Background empty star */}
          <StarIcon color="#949495" size={size} />
          {/* Foreground filled star with clip */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${partialFill}%` }}
          >
            <StarIcon color="#ffb514" size={size} />
          </div>
        </div>
      )
    } else {
      // Empty star
      stars.push(<StarIcon key={i} color="#949495" size={size} />)
    }
  }

  return stars
}
