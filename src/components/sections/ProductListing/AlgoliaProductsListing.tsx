"use client"

import { HttpTypes } from "@medusajs/types"
import {
  AlgoliaProductSidebar,
  ProductCard,
  ProductsPagination,
  ProductSortButtons,
} from "@/components/organisms"
import { client } from "@/lib/client"
import { Configure, useHits } from "react-instantsearch"
import { InstantSearchNext } from "react-instantsearch-nextjs"
import { useSearchParams } from "next/navigation"
import { getFacedFilters } from "@/lib/helpers/get-faced-filters"
import { PRODUCT_LIMIT } from "@/const"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { listProducts } from "@/lib/data/products"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { sortProducts } from "@/lib/helpers/sort-products"
import { SortOptions } from "@/types/product"

export const AlgoliaProductsListing = ({
  category_id,
  collection_id,
  seller_handle,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
  currency_code,
}: {
  category_id?: string
  collection_id?: string
  locale?: string
  seller_handle?: string
  currency_code: string
}) => {
  const searchParams = useSearchParams()

  const facetFilters: string = getFacedFilters(searchParams)
  const query: string = searchParams.get("query") || ""

  const filters = `${
    seller_handle
      ? `NOT seller:null AND seller.handle:${seller_handle} AND `
      : "NOT seller:null AND "
  }NOT seller.store_status:SUSPENDED AND supported_countries:${locale}${
    category_id
      ? ` AND categories.id:${category_id}${
          collection_id !== undefined
            ? ` AND collections.id:${collection_id}`
            : ""
        } ${facetFilters}`
      : ` ${facetFilters}`
  }`

  return (
    <InstantSearchNext searchClient={client} indexName="products">
      <Configure query={query} filters={filters} />
      <ProductsListing
        locale={locale}
        currency_code={currency_code}
        filters={filters}
      />
    </InstantSearchNext>
  )
}

const ProductsListing = ({
  locale,
  currency_code,
  filters,
}: {
  locale?: string
  currency_code: string
  filters: string
}) => {
  const { items, results } = useHits()
  const searchParams = useSearchParams()

  // State management
  const [apiProducts, setApiProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialLoad = useRef(false)
  const previousItemIdsRef = useRef<string>("")

  // Extract search params
  const page: number = +(searchParams.get("page") || 1)
  const sortBy = (searchParams.get("sortBy") as SortOptions) || "relevance"
  const minPrice = searchParams.get("min_price")
  const maxPrice = searchParams.get("max_price")

  // Create a stable string of item IDs to detect changes
  const currentItemIds = useMemo(
    () =>
      items
        .map((item) => item.objectID)
        .sort()
        .join(","),
    [items]
  )

  // Fetch products from API when items change
  useEffect(() => {
    // Skip if items haven't actually changed
    if (currentItemIds === previousItemIdsRef.current) {
      return
    }

    // Update ref immediately to prevent duplicate fetches
    previousItemIdsRef.current = currentItemIds

    // Skip if no items
    if (!items.length) {
      if (hasInitialLoad.current) {
        setApiProducts([])
      }
      return
    }

    // Mark that we've started loading (only on initial load)
    const isInitialLoad = !hasInitialLoad.current
    if (isInitialLoad) {
      setIsLoading(true)
    }

    const fetchProducts = async () => {
      try {
        const { response } = await listProducts({
          countryCode: locale,
          queryParams: {
            handle: items.map((item) => item.handle),
            limit: items.length,
          },
        })

        // Filter products with valid prices
        const validProducts = response.products.filter((prod) => {
          const { cheapestPrice } = getProductPrice({ product: prod })
          return Boolean(cheapestPrice)
        })

        // Update state in a single batch
        setApiProducts(validProducts)
      } catch (error) {
        // On error, keep previous products if available, only clear on initial load
        if (isInitialLoad) {
          setApiProducts([])
        }
      } finally {
        if (isInitialLoad) {
          setIsLoading(false)
          hasInitialLoad.current = true
        }
      }
    }

    fetchProducts()
  }, [currentItemIds, items, locale])

  // Create a Map for O(1) product lookup by ID
  const apiProductsMap = useMemo(() => {
    return new Map(apiProducts.map((p) => [p.id, p]))
  }, [apiProducts])

  // Create a Set of valid API product IDs for O(1) lookup
  const validProductIds = useMemo(() => {
    return new Set(apiProducts.map((p) => p.id))
  }, [apiProducts])

  // Filter items that have matching API products
  const filteredItems = useMemo(() => {
    return items.filter((pr) => validProductIds.has(pr.objectID))
  }, [items, validProductIds])

  // Price filter helper
  const matchesPriceFilter = useCallback(
    (product: HttpTypes.StoreProduct): boolean => {
      if (!minPrice && !maxPrice) return true

      const variantsWithCurrency = product?.variants?.filter(
        (variant) => variant.calculated_price?.currency_code === currency_code
      )

      if (!variantsWithCurrency?.length) return false

      const minPriceNum = minPrice ? +minPrice : -Infinity
      const maxPriceNum = maxPrice ? +maxPrice : Infinity

      return variantsWithCurrency.some((variant) => {
        const amount = variant.calculated_price?.calculated_amount ?? 0
        return amount >= minPriceNum && amount <= maxPriceNum
      })
    },
    [minPrice, maxPrice, currency_code]
  )

  // Get matched and filtered API products
  const matchedApiProducts = useMemo(() => {
    if (!apiProducts.length || !filteredItems.length) return []

    const filteredItemIds = new Set(filteredItems.map((pr) => pr.objectID))

    return apiProducts.filter(
      (p) => filteredItemIds.has(p.id) && matchesPriceFilter(p)
    )
  }, [apiProducts, filteredItems, matchesPriceFilter])

  // Sort the matched products
  const sortedApiProducts = useMemo(() => {
    if (!matchedApiProducts.length) return []
    return sortProducts(matchedApiProducts, sortBy)
  }, [matchedApiProducts, sortBy])

  // Create sorted product index map for efficient sorting
  const sortedProductIndexMap = useMemo(() => {
    if (!sortedApiProducts.length) return new Map<string, number>()
    return new Map(sortedApiProducts.map((p, index) => [p.id, index]))
  }, [sortedApiProducts])

  // Create sorted product IDs set
  const sortedProductIds = useMemo(() => {
    return new Set(sortedApiProducts.map((p) => p.id))
  }, [sortedApiProducts])

  // Final paginated products list
  const products = useMemo(() => {
    if (!sortedApiProducts.length) return []

    const startIndex = (page - 1) * PRODUCT_LIMIT
    const endIndex = page * PRODUCT_LIMIT

    return filteredItems
      .filter((pr) => sortedProductIds.has(pr.objectID))
      .sort((a, b) => {
        const indexA = sortedProductIndexMap.get(a.objectID) ?? Infinity
        const indexB = sortedProductIndexMap.get(b.objectID) ?? Infinity
        return indexA - indexB
      })
      .slice(startIndex, endIndex)
  }, [filteredItems, sortedProductIds, sortedProductIndexMap, page])

  // Calculate pagination
  const count = matchedApiProducts.length
  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  // Show skeleton only on initial load when we have no data
  const showSkeleton =
    !hasInitialLoad.current && (!results?.processingTimeMS || isLoading)

  if (showSkeleton) {
    return <ProductListingSkeleton />
  }

  return (
    <div className="min-h-[70vh] lg:px-20 px-4 md:pt-sop-40px pt-0 flex gap-4 lg:flex-row flex-col lg:pb-sop-40px pb-10">
      {/* NOTE - Sidebar */}
      <div className="lg:block hidden">
        <div className="lg:flex gap-4">
          <div className="lg:w-[290px] w-full lg:shrink-0">
            <AlgoliaProductSidebar
              currency_code={currency_code}
              locale={locale}
            />
          </div>
        </div>
      </div>
      {/* NOTE - Main */}
      <div className="w-full flex flex-col md:gap-6 gap-2">
        {/* NOTE - Header */}
        {searchParams.get("query") && (
          <div className="md:block hidden">
            <p className="sop-headline-md-medium text-sop-neutral-gray-300">
              ผลการค้นหาทั้งหมด &quot;{searchParams.get("query")}&quot;
            </p>
          </div>
        )}
        <div className="flex justify-between items-center">
          <ProductSortButtons />
          <div className="md:block hidden">
            <ProductsPagination pages={pages} />
          </div>
        </div>

        <div className="md:hidden block">
          <AlgoliaProductSidebar
            currency_code={currency_code}
            locale={locale}
          />
        </div>

        {/* NOTE - Content Right */}
        <div className="flex flex-col">
          <p className="sop-body-lg-medium text-sop-neutral-gray-300 md:block hidden">
            สินค้าทั้งหมด {count}
          </p>
          <div className="md:mt-5 mt-2">
            {!items.length || !products.length ? (
              <div className="text-center w-full my-10">
                <h2 className="uppercase text-primary heading-lg">
                  no results
                </h2>
                <p className="mt-4 text-lg">
                  Sorry, we can&apos;t find any results for your criteria
                </p>
              </div>
            ) : (
              <div className="w-full">
                <ul className="grid md:gap-4 gap-2 justify-items-center grid-cols-[repeat(auto-fit,minmax(165px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(223px,1fr))]">
                  {products.map((hit) => {
                    const apiProduct = apiProductsMap.get(hit.objectID)
                    if (!apiProduct) return null

                    return (
                      <ProductCard
                        api_product={apiProduct}
                        key={hit.objectID}
                        product={hit}
                      />
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
