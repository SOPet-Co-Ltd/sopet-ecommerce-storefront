"use server"
import { revalidatePath } from "next/cache"
import { sdk } from "../config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export type Review = {
  id: string
  seller: {
    id: string
    name: string
    photo: string
  }
  reference: string
  customer_note: string
  rating: number
  updated_at: string
}

export type Order = HttpTypes.StoreOrder & {
  seller: { id: string; name: string; reviews?: any[] }
  reviews: any[]
}

/**
 * Get the currently authenticated customer's ID, or null if unauthenticated
 * or if the lookup fails.
 */
export const getCurrentCustomerId = async (): Promise<string | null> => {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return null
  }

  try {
    const authResponse = await sdk.client.fetch<{
      customer?: { id: string }
    }>(`/store/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    return authResponse.customer?.id ?? null
  } catch (error) {
    console.error("Failed to get authenticated customer:", error)
    return null
  }
}

const getReviews = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await sdk.client.fetch("/store/reviews", {
    headers,
    method: "GET",
    query: { fields: "*seller,+customer.id,+order_id" },
  })

  return res
}

const createReview = async (review: any) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await sdk.client.fetch("/store/reviews", {
    headers,
    method: "POST",
    body: review,
  })

  revalidatePath("/user/reviews")
  revalidatePath("/user/reviews/written")

  return response
}

// Product Review Types for new API
export type ProductReview = {
  id: string
  product_id: string
  customer_id: string
  order_id: string | null
  rating: number
  comment: string | null
  images: string[] | null
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
  customer?: {
    id: string
    name?: string
    image?: string | null
  } | null
}

export type ReviewStats = {
  averageRating: number
  totalReviews: number
  starCounts: { starCount: number; count: number }[]
  soldCount?: number
}

type ProductReviewStatsResponse = ReviewStats & {
  review_count?: number
  average_rating?: number
  sold_count?: number
}

export type CreateProductReviewInput = {
  customer_id: string
  order_id?: string
  rating: number
  comment?: string
  images?: string[]
  is_verified_purchase?: boolean
}

export type UpdateProductReviewInput = {
  rating?: number
  comment?: string
  images?: string[]
}

type ReviewMediaUploadFile = {
  id: string
  url: string
  filename?: string
  mimeType?: string
  blurhash?: string
}

type ReviewMediaUploadResponse = {
  files: ReviewMediaUploadFile[]
}

/**
 * Get reviews for a specific product with optional filters and pagination.
 *
 * Supports query params:
 *  - rating?: number (1..5)
 *  - has_image?: string | boolean ("true"/"false" or boolean)
 *  - page?: number (1-based, defaults to 1)
 *  - limit?: number (defaults to 5, maximum enforced 5)
 *
 * Returns an object with `reviews` and `meta` so callers can render pagination UI.
 */
export type ReviewMeta = {
  page: number
  limit: number
  count: number
  total: number
  max_page: number
}

export const getProductReviews = async (
  productId: string,
  params?: {
    rating?: number
    has_image?: string | boolean
    page?: number
    limit?: number
  }
): Promise<{
  reviews: ProductReview[]
  meta: ReviewMeta
}> => {
  const headers = await getAuthHeaders()

  // Normalize / validate paging params
  const requestedPage =
    typeof params?.page === "number" &&
    Number.isInteger(params.page) &&
    params.page > 0
      ? params.page
      : 1

  let requestedLimit =
    typeof params?.limit === "number" &&
    Number.isInteger(params.limit) &&
    params.limit > 0
      ? params.limit
      : 5

  // Enforce maximum limit of 5
  if (requestedLimit > 5) requestedLimit = 5

  // Build query object
  const query: Record<string, any> = {
    page: requestedPage,
    limit: requestedLimit,
  }

  if (typeof params?.rating !== "undefined") {
    const r = Number(params.rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new Error("rating must be an integer between 1 and 5")
    }
    query.rating = r
  }

  if (typeof params?.has_image !== "undefined") {
    // Accept "true"/"false" strings or booleans
    const hi =
      params.has_image === "true" ||
      params.has_image === true ||
      params.has_image === "1"
    query.has_image = String(hi)
  }

  try {
    const data = await sdk.client.fetch<{
      reviews: ProductReview[]
      meta?: any
    }>(`/store/products/${productId}/reviews`, {
      method: "GET",
      headers,
      query,
      cache: "no-cache",
    })

    const reviews = data.reviews || []

    // If backend provided meta, use it; otherwise compute a fallback meta
    const rawMeta = data.meta || {
      page: requestedPage,
      limit: requestedLimit,
      count: reviews.length,
      total: reviews.length,
      max_page: 1,
    }

    const page = Number(rawMeta.page || requestedPage)
    const limit = Number(rawMeta.limit || requestedLimit)
    const total = Number(rawMeta.total || reviews.length)
    const count = Number(rawMeta.count || reviews.length)
    const max_page = Number(
      rawMeta.max_page || Math.max(1, Math.ceil(total / limit))
    )

    return {
      reviews,
      meta: {
        page,
        limit,
        count,
        total,
        max_page,
      },
    }
  } catch (error) {
    console.error(`Failed to fetch reviews for product ${productId}:`, error)
    return {
      reviews: [],
      meta: {
        page: requestedPage,
        limit: requestedLimit,
        count: 0,
        total: 0,
        max_page: 1,
      },
    }
  }
}

export const uploadReviewImages = async (
  files: File[],
  productId: string
): Promise<string[]> => {
  if (!files.length) return []

  const headers = await getAuthHeaders()
  if (!headers || Object.keys(headers).length === 0) {
    throw new Error("Unauthorized")
  }

  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }

  const baseUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  const url = new URL("/store/reviews/media", baseUrl)
  url.searchParams.set("product_id", productId)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "x-publishable-api-key": publishableKey,
      ...(headers as Record<string, string>),
    },
    body: formData,
  })

  let data: ReviewMediaUploadResponse | any
  try {
    data = await res.json()
  } catch {
    data = undefined
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Failed to upload review images (status ${res.status})`
    throw new Error(message)
  }

  const filesResponse: ReviewMediaUploadResponse = data
  const urls = (filesResponse.files || []).map((f) => f.url).filter(Boolean)

  if (!urls.length) {
    throw new Error("No image URLs returned from upload")
  }

  return urls
}

/**
 * Create a new review for a product with basic client-side validation.
 *
 * Validates:
 *  - `customer_id` is present
 *  - `rating` is integer between 1 and 5
 *  - `images` length <= 5
 *
 * Throws an error when validation fails so callers can show a proper message
 * before the request is sent. Backend errors are still propagated.
 */
export const createProductReview = async (
  productId: string,
  reviewData: CreateProductReviewInput
): Promise<ProductReview | null> => {
  const headers = await getAuthHeaders()

  // Client-side validation
  if (!reviewData || typeof reviewData !== "object") {
    throw new Error("reviewData is required")
  }

  if (!reviewData.customer_id || typeof reviewData.customer_id !== "string") {
    throw new Error("customer_id is required")
  }

  const rating = Number(reviewData.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("rating must be an integer between 1 and 5")
  }

  if (reviewData.images) {
    if (!Array.isArray(reviewData.images)) {
      throw new Error("images must be an array of strings")
    }
    if (reviewData.images.length > 5) {
      throw new Error("a maximum of 5 images is allowed")
    }
  }

  try {
    const data = await sdk.client.fetch<{ review: ProductReview }>(
      `/store/products/${productId}/reviews`,
      {
        method: "POST",
        headers,
        body: reviewData,
      }
    )

    revalidatePath(`/products/${productId}`)
    return data.review
  } catch (error) {
    console.error(`Failed to create review for product ${productId}:`, error)
    throw error
  }
}

/**
 * Get product review statistics (average rating and total count)
 */
export const getProductReviewStats = async (
  productId: string
): Promise<ReviewStats> => {
  const headers = await getAuthHeaders()

  try {
    const data = await sdk.client.fetch<ProductReviewStatsResponse>(
      `/store/products/${productId}/reviews/stats`,
      {
        method: "GET",
        headers,
        next: { revalidate: 0 }, // Disable cache to get fresh data
        cache: "no-store", // Force no cache
      }
    )

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log(`[REVIEWS] Stats response for product ${productId}:`, {
        sold_count: data.sold_count,
        soldCount: data.soldCount,
        fullData: data,
      })
    }

    const averageRating =
      typeof data.averageRating === "number"
        ? data.averageRating
        : typeof data.average_rating !== "undefined"
          ? Number(data.average_rating)
          : 0

    const totalReviews =
      typeof data.totalReviews === "number"
        ? data.totalReviews
        : typeof data.review_count !== "undefined"
          ? Number(data.review_count)
          : 0

    // Check both soldCount and sold_count fields
    const soldCount =
      typeof data.soldCount === "number"
        ? data.soldCount
        : typeof data.sold_count !== "undefined"
          ? Number(data.sold_count)
          : 0

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[REVIEWS] Extracted soldCount for product ${productId}:`,
        soldCount
      )
    }

    return {
      averageRating,
      totalReviews,
      starCounts: Array.isArray(data.starCounts) ? data.starCounts : [],
      soldCount,
    }
  } catch (error) {
    console.error(
      `[REVIEWS] Failed to fetch review stats for product ${productId}:`,
      error
    )
    return { averageRating: 0, totalReviews: 0, starCounts: [], soldCount: 0 }
  }
}

/**
 * Check if a customer has already reviewed a product
 */
export const checkCustomerHasReviewed = async (
  productId: string,
  customerId: string,
  orderId?: string
): Promise<boolean> => {
  const headers = await getAuthHeaders()

  try {
    const basePath = `/store/products/${productId}/reviews/check/${customerId}`
    const path =
      orderId && orderId.length > 0
        ? `${basePath}?order_id=${encodeURIComponent(orderId)}`
        : basePath

    const data = await sdk.client.fetch<{ hasReviewed: boolean }>(path, {
      method: "GET",
      headers,
      cache: "no-cache",
    })

    return data.hasReviewed
  } catch (error) {
    console.error(
      `Failed to check if customer ${customerId} reviewed product ${productId}:`,
      error
    )
    return false
  }
}

/**
 * Get all reviews by a specific customer
 */
export const getCustomerReviews = async (
  customerId: string
): Promise<ProductReview[]> => {
  const headers = await getAuthHeaders()

  try {
    const data = await sdk.client.fetch<{ reviews: ProductReview[] }>(
      `/store/customers/${customerId}/reviews`,
      {
        method: "GET",
        headers,
        cache: "no-cache",
      }
    )

    return data.reviews || []
  } catch (error) {
    console.error(`Failed to fetch reviews for customer ${customerId}:`, error)
    return []
  }
}

/**
 * Get a specific review by ID
 */
export const getReviewById = async (
  reviewId: string
): Promise<ProductReview | null> => {
  const headers = await getAuthHeaders()

  try {
    const data = await sdk.client.fetch<{ review: ProductReview }>(
      `/store/reviews/${reviewId}`,
      {
        method: "GET",
        headers,
        cache: "no-cache",
      }
    )

    return data.review
  } catch (error) {
    console.error(`Failed to fetch review ${reviewId}:`, error)
    return null
  }
}

/**
 * Update an existing review
 */
export const updateProductReview = async (
  reviewId: string,
  reviewData: UpdateProductReviewInput
): Promise<ProductReview | null> => {
  const headers = await getAuthHeaders()

  try {
    const data = await sdk.client.fetch<{ review: ProductReview }>(
      `/store/reviews/${reviewId}`,
      {
        method: "PUT",
        headers,
        body: reviewData,
      }
    )

    revalidatePath("/user/reviews")
    return data.review
  } catch (error) {
    console.error(`Failed to update review ${reviewId}:`, error)
    throw error
  }
}

/**
 * Delete a review
 */
export const deleteProductReview = async (
  reviewId: string
): Promise<boolean> => {
  const headers = await getAuthHeaders()

  try {
    await sdk.client.fetch<{ message: string }>(`/store/reviews/${reviewId}`, {
      method: "DELETE",
      headers,
    })

    revalidatePath("/user/reviews")
    return true
  } catch (error) {
    console.error(`Failed to delete review ${reviewId}:`, error)
    return false
  }
}

/**
 * Submit multiple product reviews (used by OrderCard component).
 * This server action:
 * 1. Extracts the authenticated customer ID from auth headers
 * 2. Submits all reviews in parallel
 * 3. Returns success/failure results for each review
 *
 * The client passes review data WITHOUT customer_id;
 * the server adds the authenticated customer's ID automatically.
 */
export const submitProductReviews = async (
  reviews: Array<{
    productId: string
    rating: number
    comment?: string
    images?: string[] // File URLs (already converted from File[])
    order_id?: string
  }>
): Promise<{
  success: boolean
  results: Array<{
    productId: string
    success: boolean
    review?: ProductReview
    error?: string
  }>
}> => {
  const headers = await getAuthHeaders()

  // Get the authenticated customer ID
  let customerId: string | undefined
  try {
    const authResponse = await sdk.client.fetch<{
      customer?: { id: string }
    }>(`/store/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    customerId = authResponse.customer?.id
    if (!customerId) {
      throw new Error("Customer not found. Please log in.")
    }
  } catch (error) {
    console.error("Failed to get authenticated customer:", error)
    return {
      success: false,
      results: reviews.map((r) => ({
        productId: r.productId,
        success: false,
        error: "Authentication failed. Please log in.",
      })),
    }
  }

  // Submit all reviews in parallel
  const results = await Promise.all(
    reviews.map(async (review) => {
      try {
        const reviewData: CreateProductReviewInput = {
          customer_id: customerId!,
          rating: review.rating,
          comment: review.comment,
          images: review.images,
          order_id: review.order_id,
        }

        const productReview = await createProductReview(
          review.productId,
          reviewData
        )

        return {
          productId: review.productId,
          success: true,
          review: productReview || undefined,
        }
      } catch (error) {
        return {
          productId: review.productId,
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to submit review",
        }
      }
    })
  )

  const allSuccess = results.every((r) => r.success)
  return {
    success: allSuccess,
    results,
  }
}

export { getReviews, createReview }
