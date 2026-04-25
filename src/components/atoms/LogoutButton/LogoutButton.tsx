"use client"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"

type LogoutButtonProps = {
  unstyled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  unstyled,
  className,
  children,
}) => {
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : "th"

  const handleLogout = () => {
    window.location.assign(`/${locale}/signout`)
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        !unstyled && "label-md uppercase px-4 py-3 my-3 md:my-0",
        className
      )}
    >
      {children || "Logout"}
    </button>
  )
}
