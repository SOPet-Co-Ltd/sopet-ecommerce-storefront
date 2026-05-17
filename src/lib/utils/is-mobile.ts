"use client"

import { useEffect, useState } from "react"

export const isMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    check()
    window.addEventListener("resize", check)

    return () => window.removeEventListener("resize", check)
  }, [breakpoint])

  return isMobile
}
