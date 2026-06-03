"use client"

import { MessageIcon } from "@/icons"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"

export const MessageButton = () => {
  return (
    <LocalizedClientLink href="/user/messages" className="relative">
      <MessageIcon size={20} />
    </LocalizedClientLink>
  )
}
