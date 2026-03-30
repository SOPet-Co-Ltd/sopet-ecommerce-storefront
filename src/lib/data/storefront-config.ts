"use server"

import { sdk } from "../config"

export type StorefrontConfigMedia = {
  id: string
  image_url: string
  name?: string
  href?: string
  order: number
}

export type StorefrontSponsor = StorefrontConfigMedia
export type StorefrontBanner = StorefrontConfigMedia

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeStorefrontItems = (
  items: unknown,
  fallbackPrefix: string
): StorefrontConfigMedia[] => {
  if (!Array.isArray(items)) {
    return []
  }

  const normalized: Array<StorefrontConfigMedia | null> = items.map(
    (item, index) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const row = item as Record<string, unknown>
      const imageUrl = asString(row.image_url) ?? asString(row.url)

      if (!imageUrl) {
        return null
      }

      const name = asString(row.name)
      const href = asString(row.href)

      return {
        id: asString(row.id) ?? `${fallbackPrefix}-${index + 1}`,
        image_url: imageUrl,
        ...(name ? { name } : {}),
        ...(href ? { href } : {}),
        order:
          typeof row.order === "number" && Number.isFinite(row.order)
            ? row.order
            : index,
      }
    }
  )

  const filtered = normalized.filter(
    (item): item is StorefrontConfigMedia => item !== null
  )

  filtered.sort((a, b) => a.order - b.order)
  return filtered
}

export const listStorefrontSponsors = async (): Promise<
  StorefrontSponsor[]
> => {
  try {
    const response = await sdk.client.fetch<{ sponsors?: unknown }>(
      "/store/storefront-config",
      {
        method: "GET",
        cache: "force-cache",
        next: {
          revalidate: 60,
        },
      }
    )

    return normalizeStorefrontItems(response?.sponsors, "sponsor")
  } catch {
    return []
  }
}

export const listStorefrontBanners = async (): Promise<StorefrontBanner[]> => {
  try {
    const response = await sdk.client.fetch<{ banners?: unknown }>(
      "/store/banners",
      {
        method: "GET",
        cache: "force-cache",
        next: {
          revalidate: 60,
        },
      }
    )

    return normalizeStorefrontItems(response?.banners, "banner")
  } catch {
    return []
  }
}
