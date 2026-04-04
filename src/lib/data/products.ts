"use server"

import { sdk } from "../config"
import { sortProducts } from "@/lib/helpers/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@/types/product"
import { getAuthHeaders } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { SellerProps } from "@/types/seller"

export type ProductWithSeller = HttpTypes.StoreProduct & {
  seller?: SellerProps
  review_count?: number | null
  average_rating?: number | null
  sold_count?: number | null
}

type ProductStats = {
  review_count?: number
  totalReviews?: number
  average_rating?: number
  averageRating?: number
  sold_count?: number
}

type ListProductsParams = {
  pageParam?: number
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & {
      handle?: string[]
      id?: string[]
    }
  category_id?: string
  collection_id?: string
  countryCode?: string
  regionId?: string
  forceCache?: boolean
  /** When true, return all fetched products (e.g. re-hydrating items the user already purchased). */
  skipPublishedToAlgoliaFilter?: boolean
}

type ListProductsResponse = {
  response: {
    products: ProductWithSeller[]
    count: number
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}

// Default fields to fetch for products (include metadata for published_to_algolia filter)
const DEFAULT_FIELDS = [
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "*seller",
  "*variants",
  "*seller.products",
  "*seller.products.reviews",
  "*seller.products.reviews.customer",
  "*seller.reviews",
  "*seller.reviews.customer",
  "*seller.reviews.seller",
  "*seller.products.variants",
  "*attribute_values",
  "*attribute_values.attribute",
  "+product_reviews",
  "+product_review",
  "+review_count",
  "+average_rating",
  "+sold_count",
  "+metadata",
] as const

const REQUIRED_FIELDS = [
  "+review_count",
  "+average_rating",
  "+sold_count",
] as const

/**
 * Builds the fields query parameter, merging custom fields with required fields
 */
const buildFieldsQuery = (customFields?: string | string[]): string => {
  if (!customFields) {
    return DEFAULT_FIELDS.join(",")
  }

  const queryFields =
    typeof customFields === "string"
      ? customFields.split(",").map((f) => f.trim())
      : customFields

  const mergedFields = [...new Set([...queryFields, ...REQUIRED_FIELDS])]
  return mergedFields.join(",")
}

/**
 * Fetches product stats from the API
 */
const fetchProductStats = async (
  productId: string,
  headers: Record<string, string>,
  useCached: boolean
): Promise<ProductStats | null> => {
  try {
    const stats = await sdk.client.fetch<ProductStats>(
      `/store/products/${productId}/reviews/stats`,
      {
        method: "GET",
        headers,
        next: useCached ? { revalidate: 60 } : undefined,
        cache: useCached ? "force-cache" : "no-cache",
      }
    )
    return stats
  } catch {
    return null
  }
}

/**
 * Extracts stats values with fallback logic
 */
const extractStats = (
  stats: ProductStats | null,
  product: ProductWithSeller
): {
  review_count: number
  average_rating: number
  sold_count: number
} => {
  return {
    review_count:
      stats?.review_count ?? stats?.totalReviews ?? product.review_count ?? 0,
    average_rating:
      stats?.average_rating ??
      stats?.averageRating ??
      product.average_rating ??
      0,
    sold_count: stats?.sold_count ?? product.sold_count ?? 0,
  }
}

/**
 * Processes a single product with stats
 */
const processProductWithStats = async (
  product: ProductWithSeller,
  headers: Record<string, string>,
  useCached: boolean
): Promise<ProductWithSeller> => {
  const stats = await fetchProductStats(product.id, headers, useCached)
  const extractedStats = extractStats(stats, product)

  const reviews = product.seller?.reviews?.filter((item) => !!item) ?? []

  return {
    ...product,
    ...extractedStats,
    seller: product.seller
      ? {
          ...product.seller,
          reviews,
        }
      : undefined,
  }
}

/**
 * Filters out suspended sellers and processes products with stats
 */
const processProducts = async (
  products: ProductWithSeller[],
  headers: Record<string, string>,
  useCached: boolean
): Promise<ProductWithSeller[]> => {
  // Filter out suspended sellers first
  const activeProducts = products.filter(
    (product) => product.seller?.store_status !== "SUSPENDED"
  )

  // Process all products in parallel
  return Promise.all(
    activeProducts.map((product) =>
      processProductWithStats(product, headers, useCached)
    )
  )
}

/**
 * Builds query parameters for the products API call
 */
const buildProductsQuery = (
  params: ListProductsParams,
  region: HttpTypes.StoreRegion | null | undefined,
  limit: number,
  offset: number
): Record<string, unknown> => {
  const { queryParams, countryCode, category_id, collection_id } = params

  return {
    country_code: countryCode,
    category_id,
    collection_id,
    limit,
    offset,
    region_id: region?.id,
    fields: buildFieldsQuery(queryParams?.fields),
    ...(queryParams
      ? Object.fromEntries(
          Object.entries(queryParams).filter(([key]) => key !== "fields")
        )
      : {}),
  }
}

export const listProducts = async (
  params: ListProductsParams
): Promise<ListProductsResponse> => {
  const {
    pageParam = 1,
    queryParams,
    countryCode,
    regionId,
    forceCache = false,
    skipPublishedToAlgoliaFilter = false,
  } = params

  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const pageParamValue = Math.max(pageParam, 1)
  const offset = (pageParamValue - 1) * limit

  // Fetch region
  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = await getAuthHeaders()
  const requestsSpecificProducts = Boolean(
    (params.queryParams?.handle?.length ?? 0) > 0 ||
    (params.queryParams?.id?.length ?? 0) > 0
  )
  const useCached =
    forceCache ||
    (!requestsSpecificProducts &&
      limit <= 8 &&
      !params.category_id &&
      !params.collection_id)

  try {
    const { products: productsRaw, count } = await sdk.client.fetch<{
      products: ProductWithSeller[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: buildProductsQuery(params, region, limit, offset),
      headers,
      next: useCached ? { revalidate: 60 } : undefined,
      cache: useCached ? "force-cache" : "no-cache",
    })

    const productsWithStats = await processProducts(
      productsRaw,
      headers,
      useCached
    )

    const publishedProducts = skipPublishedToAlgoliaFilter
      ? productsWithStats
      : productsWithStats.filter(
          (p) => p.metadata?.published_to_algolia === true
        )
    const nextPage = count > offset + limit ? pageParamValue + 1 : null

    return {
      response: {
        products: publishedProducts,
        count,
      },
      nextPage,
      queryParams,
    }
  } catch {
    return {
      response: {
        products: [],
        count: 0,
      },
      nextPage: null,
      queryParams,
    }
  }
}

/**
 * Fetches products, sorts them, and returns paginated results.
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  category_id,
  seller_id,
  collection_id,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  category_id?: string
  seller_id?: string
  collection_id?: string
}): Promise<ListProductsResponse> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    category_id,
    collection_id,
    countryCode,
  })

  // Filter by seller if specified
  const filteredProducts = seller_id
    ? products.filter((product) => product.seller?.id === seller_id)
    : products

  // Filter products with valid prices
  const pricedProducts = filteredProducts.filter((prod) =>
    prod.variants?.some((variant) => variant.calculated_price !== null)
  )

  // Sort products
  const sortedProducts = sortProducts(pricedProducts, sortBy)

  // Calculate pagination
  const pageParam = (page - 1) * limit
  const nextPage = count > pageParam + limit ? pageParam + limit : null
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

export type ProductSectionType = "latest-purchased" | "recommended"

type SectionResponse = {
  product_ids: string[]
  count: number
}

/**
 * Fetches product IDs from a section API, then loads full product data and returns
 * products in the section order. Used for latest-purchased and recommended sections.
 */
export const getSectionProducts = async ({
  section,
  countryCode,
  limit = 12,
  offset = 0,
}: {
  section: ProductSectionType
  countryCode: string
  limit?: number
  offset?: number
}): Promise<{
  products: ProductWithSeller[]
  count: number
  nextPage: number | null
}> => {
  const headers = await getAuthHeaders()
  try {
    const sectionData = await sdk.client.fetch<SectionResponse>(
      `/store/products/sections/${section}`,
      {
        method: "GET",
        query: { limit, offset, country_code: countryCode },
        headers,
        next: { revalidate: 60 },
        cache: "force-cache",
      }
    )
    const { product_ids, count } = sectionData ?? { product_ids: [], count: 0 }
    if (!product_ids?.length) {
      return { products: [], count: 0, nextPage: null }
    }
    const {
      response: { products: productsRaw },
    } = await listProducts({
      countryCode,
      pageParam: 1,
      queryParams: { id: product_ids, limit: product_ids.length },
      forceCache: true,
    })
    const orderMap = new Map(product_ids.map((id, i) => [id, i]))
    const sorted = [...productsRaw].sort(
      (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
    )
    const nextPage =
      count > offset + limit ? Math.floor(offset / limit) + 2 : null
    return {
      products: sorted,
      count,
      nextPage,
    }
  } catch {
    return { products: [], count: 0, nextPage: null }
  }
}
