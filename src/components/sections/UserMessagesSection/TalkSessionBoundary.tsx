"use client"

import { Session } from "@talkjs/react"
import type { ReactNode } from "react"

type TalkSessionBoundaryProps = {
  appId?: string
  userId?: string
  children: ReactNode
}

export const TalkSessionBoundary = ({
  appId,
  userId,
  children,
}: TalkSessionBoundaryProps) => {
  if (!appId || !userId) {
    return <>{children}</>
  }

  return (
    <Session appId={appId} userId={userId}>
      {children}
    </Session>
  )
}
