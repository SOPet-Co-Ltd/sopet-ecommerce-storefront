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

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
  forceCache = false,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams &
  HttpTypes.StoreProductParams & {
    handle?: string[]
  }
  category_id?: string
  collection_id?: string
  countryCode?: string
  regionId?: string
  forceCache?: boolean
}): Promise<{
  response: {
    products: ProductWithSeller[]
    count: number
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const useCached = forceCache || (limit <= 8 && !category_id && !collection_id)

  return sdk.client
    .fetch<{
      products: ProductWithSeller[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        country_code: countryCode,
        category_id,
        collection_id,
        limit,
        offset,
        region_id: region?.id,
        fields: (() => {
          const defaultFields = [
            "*variants.calculated_price",
            "+variants.inventory_quantity",
            "*seller",
            "*variants",
            "*seller.products",
            "*seller.products.reviews",
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
          ]
          
          // If queryParams has fields, merge them with required fields
          if (queryParams?.fields) {
            const queryFields = typeof queryParams.fields === "string" 
              ? queryParams.fields.split(",").map(f => f.trim())
              : Array.isArray(queryParams.fields)
              ? queryParams.fields
              : []
            
            // Ensure required fields are included
            const requiredFields = ["+review_count", "+average_rating", "+sold_count"]
            const mergedFields = [...new Set([...queryFields, ...requiredFields])]
            return mergedFields.join(",")
          }
          
          return defaultFields.join(",")
        })(),
        ...(queryParams ? Object.fromEntries(
          Object.entries(queryParams).filter(([key]) => key !== "fields")
        ) : {}),
      },
      headers,
      next: useCached ? { revalidate: 60 } : undefined,
      cache: useCached ? "force-cache" : "no-cache",
    })
    .then(async ({ products: productsRaw, count }) => {
      const products = productsRaw.filter(
        (product) => product.seller?.store_status !== "SUSPENDED"
      )

      const nextPage = count > offset + limit ? pageParam + 1 : null

      // Fetch review stats and sold_count for each product
      const productsWithStats = await Promise.all(
        products.map(async (prod) => {
          try {
            // Fetch review stats
            const statsRes = await sdk.client
              .fetch(`/store/products/${prod.id}/reviews/stats`, {
                method: "GET",
                headers,
                next: useCached ? { revalidate: 60 } : undefined,
                cache: useCached ? "force-cache" : "no-cache",
              })
              .catch(() => null)

            // Get sold_count from the product if available, otherwise fetch from database
            // Note: sold_count should be in the product if fields were requested correctly
            const stats = statsRes as { review_count?: number; totalReviews?: number; average_rating?: number; averageRating?: number } | null
            const reviewCount = stats?.review_count ?? stats?.totalReviews ?? (prod as ProductWithSeller).review_count ?? 0
            const averageRating = stats?.average_rating ?? stats?.averageRating ?? (prod as ProductWithSeller).average_rating ?? 0
            const soldCount = (prod as ProductWithSeller).sold_count ?? 0

            const reviews = prod.seller?.reviews?.filter((item) => !!item) ?? []
            
            return {
              ...prod,
              review_count: reviewCount,
              average_rating: averageRating,
              sold_count: soldCount,
              seller: prod.seller ? {
                ...prod.seller,
                reviews,
              } : undefined,
            }
          } catch (error) {
            // If fetching stats fails, return product with defaults
            const reviews = prod.seller?.reviews?.filter((item) => !!item) ?? []
            const productWithSeller = prod as ProductWithSeller
            return {
              ...prod,
              review_count: productWithSeller.review_count ?? 0,
              average_rating: productWithSeller.average_rating ?? 0,
              sold_count: productWithSeller.sold_count ?? 0,
              seller: prod.seller ? {
                ...prod.seller,
                reviews,
              } : undefined,
            }
          }
        })
      )

      const response = productsWithStats

      return {
        response: {
          products: response,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
    .catch(() => {
      return {
        response: {
          products: [],
          count: 0,
        },
        nextPage: 0,
        queryParams,
      }
    })
}

/**
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
}): Promise<{
  response: {
    products: HttpTypes.StoreProduct[]
    count: number
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
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

  const filteredProducts = seller_id
    ? products.filter((product) => product.seller?.id === seller_id)
    : products

  const pricedProducts = filteredProducts.filter((prod) =>
    prod.variants?.some((variant) => variant.calculated_price !== null)
  )

  const sortedProducts = sortProducts(pricedProducts, sortBy)

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
