"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"

/**
 * Use this component to create a Next.js `<LocalizedClientLink />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: ReactNode
  href: string
} & Omit<ComponentProps<typeof Link>, "href" | "children">) => {
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : ""
  const normalizedHref = href.startsWith("/") ? href : `/${href}`
  const localizedHref = `/${locale}${normalizedHref}`

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
