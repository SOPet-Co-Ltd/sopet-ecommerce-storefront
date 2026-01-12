import { ProfileFilledIcon, ProfileIcon } from "@/icons"
import Image from "next/image"

export const SellerAvatar = ({
  photo = "",
  size = 32,
  alt = "",
}: {
  photo?: string
  size?: number
  alt?: string
}) => {
  return photo ? (
    <Image
      src={decodeURIComponent(photo)}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  ) : (
    <ProfileFilledIcon size={size} color="#211F23" />
  )
}
