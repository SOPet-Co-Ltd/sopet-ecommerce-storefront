"use client"

import { X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useAdsQuery } from "@/hooks/useAdsQuery"

const ADS_DISMISS_STORAGE_KEY = "sopet:storefront:promo-ads:dismiss-state"
const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000
const ADS_IMAGE_ALT = "SOPet promotional advertisement"

type AdsDismissState = {
  dismissedAt: number
  expiresAt: number
}

const getCooldownMs = () => {
  const raw = process.env.NEXT_PUBLIC_PROMO_ADS_MODAL_COOLDOWN_MS
  const parsed = Number(raw)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return DEFAULT_COOLDOWN_MS
}

const parseDismissState = (value: string | null): AdsDismissState | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<AdsDismissState> | null
    if (
      !parsed ||
      typeof parsed.dismissedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null
    }

    return {
      dismissedAt: parsed.dismissedAt,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

export const PromotionalAdsModal = () => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const cooldownMs = useMemo(getCooldownMs, [])
  const adsQuery = useAdsQuery()
  const ad = adsQuery.data

  useEffect(() => {
    const now = Date.now()
    const storedValue = localStorage.getItem(ADS_DISMISS_STORAGE_KEY)
    const dismissState = parseDismissState(storedValue)

    if (dismissState && dismissState.expiresAt > now) {
      setIsOpen(false)
      setIsHydrated(true)
      return
    }

    if (dismissState && dismissState.expiresAt <= now) {
      localStorage.removeItem(ADS_DISMISS_STORAGE_KEY)
    }

    setIsOpen(true)
    setIsHydrated(true)
  }, [])

  const handleDismiss = useCallback(() => {
    const dismissedAt = Date.now()
    const expiresAt = dismissedAt + cooldownMs

    const payload: AdsDismissState = {
      dismissedAt,
      expiresAt,
    }

    localStorage.setItem(ADS_DISMISS_STORAGE_KEY, JSON.stringify(payload))
    setIsOpen(false)
  }, [cooldownMs])

  if (!isHydrated || !isOpen || adsQuery.isPending || !ad) {
    return null
  }

  return (
    <Modal
      onClose={handleDismiss}
      closeOnBackdropClick
      width={420}
      className="rounded-2xl bg-transparent shadow-none border-0 p-0"
      overlayClassName="bg-sop-neutral-whitealpha-400 backdrop-blur-sm"
    >
      <div className="relative p-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-sop-neutral-gray-500 text-sop-neutral-gray-100 shadow-xs"
        >
          <X size={16} />
        </button>

        <div className="relative mx-auto w-full max-w-90 overflow-hidden rounded-xl">
          <div className="relative aspect-4/5">
            <img
              src={ad.image_url}
              alt={ADS_IMAGE_ALT}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
