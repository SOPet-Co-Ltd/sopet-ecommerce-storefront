import React from "react"
import Image from "next/image"
import Link from "next/link"

export interface NotificationCardProps {
  id?: string | number
  title: string
  description: string
  date: string
  image: string
  isUnread?: boolean
  href?: string
  onClick?: () => void
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  date,
  image,
  isUnread = false,
  href,
  onClick,
}) => {
  const innerContent = (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-4 cursor-pointer transition-colors duration-200 hover:bg-sop-primary-200 ${
        isUnread ? "bg-sop-primary-100" : "bg-transparent"
      }`}
    >
      <div className="relative w-24 h-24 shrink-0 bg-sop-neutral-gray-500 rounded-md overflow-hidden">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="flex flex-col flex-1 gap-1">
        <h3 className="sop-body-md-medium text-sop-neutral-gray-200">
          {title}
        </h3>
        <p className="sop-body-md-regular text-sop-neutral-gray-400">
          {description}
        </p>
        <div className="mt-1 text-sop-neutral-gray-400 sop-body-sm-regular">
          {date}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {innerContent}
      </Link>
    )
  }

  return <div className="block w-full">{innerContent}</div>
}
