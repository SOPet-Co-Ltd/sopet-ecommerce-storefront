import type { HttpTypes } from "@medusajs/types"
import type { Seller, SellerProps } from "@/types/seller"

type SellerLike =
  | {
      id?: string | null
      name?: string | null
      handle?: string | null
      photo?: string | null
      created_at?: string | null
      description?: string | null
      tax_id?: string | null
      email?: string | null
      store_status?: Seller["store_status"] | null
    }
  | null
  | undefined

type CartItemLike = Pick<
  HttpTypes.StoreCartLineItem,
  "id" | "product_id" | "variant_id" | "metadata"
> & {
  product?: (HttpTypes.StoreProduct & { seller?: SellerLike }) | null
  variant?:
    | (HttpTypes.StoreProductVariant & {
        product?: { seller?: SellerLike } | null
      })
    | null
}

type CartItemMetadata = Record<string, unknown> | null | undefined

type CartVariantOptionMetadata = {
  option_title?: string | null
  value?: string | null
}

const DEFAULT_CART_SELLER_NAME = "ร้านค้าไม่ระบุ"
const DEFAULT_CART_SELLER_PHOTO = "/images/placeholder.svg"
const DEFAULT_CART_SELLER_CREATED_AT = new Date(0).toISOString()
const GENERIC_SELLER_NAMES = new Set([
  DEFAULT_CART_SELLER_NAME.toLowerCase(),
  "sopet",
  "so pet",
  "sopet store",
  "default seller",
  "unknown seller",
])

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value !== "string") {
      continue
    }

    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return undefined
}

const SYNTHETIC_SELLER_ID_PREFIXES = ["handle:", "name:", "line:"] as const

const getItemFallbackKey = (item: CartItemLike) => {
  return (
    item.id ||
    [item.product_id || "unknown-product", item.variant_id || "unknown-variant"]
      .filter(Boolean)
      .join(":")
  )
}

const isSyntheticSellerId = (id: string) =>
  SYNTHETIC_SELLER_ID_PREFIXES.some((prefix) => id.startsWith(prefix))

const buildNameGroupKey = (name: string) => `name:${name.trim().toLowerCase()}`

const buildSyntheticSellerId = (
  item: CartItemLike,
  handle?: string,
  name?: string
) => {
  if (handle) {
    return `handle:${handle}`
  }

  if (name) {
    return buildNameGroupKey(name)
  }

  return `line:${getItemFallbackKey(item)}`
}

export const buildStorefrontCartItemMetadata = (
  product: HttpTypes.StoreProduct & { seller?: SellerProps },
  variantId: string
) => {
  const variant = product.variants?.find(
    (candidate) => candidate.id === variantId
  )
  const thumbnail =
    product.thumbnail ??
    (product.images && product.images.length > 0
      ? (product.images[0]?.url ?? null)
      : null)
  const variantOptions =
    variant?.options
      ?.map((option) => ({
        option_title: option.option?.title ?? null,
        value: option.value ?? null,
      }))
      .filter(
        (option) =>
          typeof option.value === "string" && option.value.trim().length > 0
      ) ?? []

  return {
    product_title: product.title ?? "",
    product_handle: product.handle ?? "",
    thumbnail,
    variant_title: variant?.title ?? "",
    variant_options: variantOptions,
    seller_id: product.seller?.id ?? null,
    seller_name: product.seller?.name ?? null,
    seller_handle: product.seller?.handle ?? null,
    seller_photo: product.seller?.photo ?? null,
  }
}

const toVariantOptionsMetadata = (
  metadata: CartItemMetadata
): CartVariantOptionMetadata[] => {
  const raw = metadata?.variant_options

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(
      (option): option is CartVariantOptionMetadata =>
        typeof option === "object" && option !== null
    )
    .map((option) => ({
      option_title: firstString(option.option_title),
      value: firstString(option.value),
    }))
    .filter((option) => Boolean(option.option_title || option.value))
}

export const getCartItemVariantOptionsFromMetadata = (
  metadata: CartItemMetadata
): HttpTypes.StoreProductOptionValue[] | undefined => {
  const options = toVariantOptionsMetadata(metadata).map(
    (option) =>
      ({
        value: option.value ?? "",
        option: {
          title: option.option_title ?? "",
        },
      }) as unknown as HttpTypes.StoreProductOptionValue
  )

  return options.length > 0 ? options : undefined
}

export const getCartItemSeller = (
  item: CartItemLike,
  sellerOverride?: SellerLike
): Seller | null => {
  const metadata =
    (item.metadata as Record<string, unknown> | null | undefined) ?? null
  const productSeller = item.product?.seller
  const variantSeller = item.variant?.product?.seller

  const id = firstString(
    sellerOverride?.id,
    productSeller?.id,
    variantSeller?.id,
    metadata?.seller_id,
    metadata?.store_id,
    metadata?.vendor_id
  )
  const handle = firstString(
    sellerOverride?.handle,
    productSeller?.handle,
    variantSeller?.handle,
    metadata?.seller_handle
  )
  const name = firstString(
    sellerOverride?.name,
    productSeller?.name,
    variantSeller?.name,
    metadata?.seller_name,
    metadata?.store_name,
    metadata?.storeName,
    handle
  )

  if (!id && !handle && !name) {
    return null
  }

  return {
    id: id ?? buildSyntheticSellerId(item, handle, name),
    name: name ?? handle ?? DEFAULT_CART_SELLER_NAME,
    handle: handle ?? "",
    photo:
      firstString(
        sellerOverride?.photo,
        productSeller?.photo,
        variantSeller?.photo,
        metadata?.seller_photo
      ) ?? DEFAULT_CART_SELLER_PHOTO,
    created_at:
      firstString(
        sellerOverride?.created_at,
        productSeller?.created_at,
        variantSeller?.created_at,
        metadata?.seller_created_at
      ) ?? DEFAULT_CART_SELLER_CREATED_AT,
    description:
      firstString(
        sellerOverride?.description,
        productSeller?.description,
        variantSeller?.description,
        metadata?.seller_description
      ) ?? "",
    tax_id:
      firstString(
        sellerOverride?.tax_id,
        productSeller?.tax_id,
        variantSeller?.tax_id,
        metadata?.seller_tax_id
      ) ?? "",
    email: firstString(
      sellerOverride?.email,
      productSeller?.email,
      variantSeller?.email
    ),
    store_status:
      sellerOverride?.store_status ??
      productSeller?.store_status ??
      variantSeller?.store_status ??
      undefined,
  }
}

export const getCartItemSellerGroup = (
  item: CartItemLike,
  sellerOverride?: SellerLike
) => {
  const seller = getCartItemSeller(item, sellerOverride)

  if (seller) {
    const normalizedHandle = seller.handle.trim().toLowerCase()
    const normalizedName = seller.name.trim().toLowerCase()
    const hasReliableDisplayName =
      Boolean(normalizedName) && !GENERIC_SELLER_NAMES.has(normalizedName)

    const hasRealSellerId =
      Boolean(seller.id) && !isSyntheticSellerId(seller.id)

    return {
      key:
        (hasRealSellerId && `${seller.id}`) ||
        (normalizedHandle && `handle:${normalizedHandle}`) ||
        (hasReliableDisplayName && buildNameGroupKey(seller.name)) ||
        (normalizedName && buildNameGroupKey(seller.name)) ||
        seller.id,
      seller,
    }
  }

  const key = `line:${getItemFallbackKey(item)}`

  return {
    key,
    seller: {
      id: key,
      name: DEFAULT_CART_SELLER_NAME,
      handle: "",
      photo: DEFAULT_CART_SELLER_PHOTO,
      created_at: DEFAULT_CART_SELLER_CREATED_AT,
      description: "",
      tax_id: "",
    } satisfies Seller,
  }
}
