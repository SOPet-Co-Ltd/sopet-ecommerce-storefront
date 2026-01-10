"use client"

import { HttpTypes } from "@medusajs/types"
import {
  AlgoliaProductSidebar,
  ProductCard,
  ProductCardOld,
  ProductListingActiveFilters,
  ProductsPagination,
  ProductSortButtons,
} from "@/components/organisms"
import { client } from "@/lib/client"
import { Configure, SearchBox, useHits } from "react-instantsearch"
import { InstantSearchNext } from "react-instantsearch-nextjs"
import { useSearchParams } from "next/navigation"
import { getFacedFilters } from "@/lib/helpers/get-faced-filters"
import { PRODUCT_LIMIT } from "@/const"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { useEffect, useState, useMemo } from "react"
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
  const searchParamas = useSearchParams()

  const facetFilters: string = getFacedFilters(searchParamas)
  const query: string = searchParamas.get("query") || ""

  const filters = `${seller_handle
    ? `NOT seller:null AND seller.handle:${seller_handle} AND `
    : "NOT seller:null AND "
    }NOT seller.store_status:SUSPENDED AND supported_countries:${locale}${category_id
      ? ` AND categories.id:${category_id}${collection_id !== undefined
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
  const [apiProducts, setApiProducts] = useState<
    HttpTypes.StoreProduct[] | null
  >(null)
  const { items, results } = useHits()

  const searchParamas = useSearchParams()

  async function handleSetProducts() {
    try {
      setApiProducts(null)
      const { response } = await listProducts({
        countryCode: locale,
        queryParams: {
          handle: items.map((item) => item.handle),
          limit: items.length,
        },
      })

      setApiProducts(
        response.products.filter((prod) => {
          const { cheapestPrice } = getProductPrice({ product: prod })
          return Boolean(cheapestPrice) && prod
        })
      )
    } catch (error) {
      setApiProducts(null)
    }
  }

  useEffect(() => {
    handleSetProducts()
  }, [items.length])

  // All hooks must be called before any early returns
  const page: number = +(searchParamas.get("page") || 1)
  const sortBy = (searchParamas.get("sortBy") as SortOptions) || "relevance"
  const minPrice = searchParamas.get("min_price")
  const maxPrice = searchParamas.get("max_price")

  const filteredProducts = useMemo(() => {
    return items.filter((pr) =>
      apiProducts?.some((p: any) => p.id === pr.objectID)
    )
  }, [items, apiProducts])

  // Get the API products that match the filtered products
  const matchedApiProducts = useMemo(() => {
    if (!apiProducts || !filteredProducts.length) return []

    const filterProductsByCurrencyCode = (product: HttpTypes.StoreProduct) => {
      if ([minPrice, maxPrice].some((price) => typeof price === "string")) {
        const variantsWithCurrencyCode = product?.variants?.filter(
          (variant) => variant.calculated_price?.currency_code === currency_code
        )

        if (!variantsWithCurrencyCode?.length) {
          return false
        }

        if (minPrice && maxPrice) {
          return variantsWithCurrencyCode.some(
            (variant) =>
              (variant.calculated_price?.calculated_amount ?? 0) >= +minPrice &&
              (variant.calculated_price?.calculated_amount ?? 0) <= +maxPrice
          )
        }
        if (minPrice) {
          return variantsWithCurrencyCode.some(
            (variant) =>
              (variant.calculated_price?.calculated_amount ?? 0) >= +minPrice
          )
        }
        if (maxPrice) {
          return variantsWithCurrencyCode.some(
            (variant) =>
              (variant.calculated_price?.calculated_amount ?? 0) <= +maxPrice
          )
        }
      }

      return true
    }

    return apiProducts.filter((p: any) =>
      filteredProducts.some((pr) => pr.objectID === p.id && filterProductsByCurrencyCode(p))
    )
  }, [apiProducts, filteredProducts, minPrice, maxPrice, currency_code])

  // Sort the API products
  const sortedApiProducts = useMemo(() => {
    if (!matchedApiProducts.length) return []
    return sortProducts(matchedApiProducts, sortBy)
  }, [matchedApiProducts, sortBy])

  // Map sorted products back to Algolia hits
  const products = useMemo(() => {
    if (!sortedApiProducts.length) return []
    const sortedProductIds = new Set(sortedApiProducts.map((p: any) => p.id))
    return filteredProducts
      .filter((pr) => sortedProductIds.has(pr.objectID))
      .sort((a, b) => {
        const indexA = sortedApiProducts.findIndex((p: any) => p.id === a.objectID)
        const indexB = sortedApiProducts.findIndex((p: any) => p.id === b.objectID)
        return indexA - indexB
      })
      .slice((page - 1) * PRODUCT_LIMIT, page * PRODUCT_LIMIT)
  }, [filteredProducts, sortedApiProducts, page])

  const count = matchedApiProducts?.length || 0
  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  // Early return after all hooks
  if (!results?.processingTimeMS) return <ProductListingSkeleton />

  return (
    <div className="min-h-[70vh] md:px-20 px-4 md:pt-sop-40px pt-0 flex gap-4 md:flex-row flex-col md:pb-sop-40px pb-10">
      {/* NOTE - Sidebar */}
      <div className="lg:block hidden">
        {/* NOTE - Content Left - Filter */}
        {/* <div className="flex justify-between w-full items-center">
          <div className="my-4 label-md">{`${count} listings`}</div>
        </div>
        <div className="hidden md:block">
          <ProductListingActiveFilters />
        </div> */}
        <div className="md:flex gap-4">
          <div className="md:w-[290px] w-full md:shrink-0">
            <AlgoliaProductSidebar currency_code={currency_code} locale={locale} />
          </div>
        </div>
      </div>
      {/* NOTE - Main */}
      <div className="w-full flex flex-col md:gap-6 gap-2">
        {/* NOTE - Header */}
        {searchParamas.get("query") && (
          <div className="md:block hidden">
            <p className="sop-headline-md-medium text-sop-neutral-gray-300">
              ผลการค้นหาทั้งหมด &quot;{searchParamas.get("query")}&quot;
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
          <AlgoliaProductSidebar currency_code={currency_code} locale={locale} />
        </div>

        {/* NOTE - Content Right */}
        <div className="flex flex-col">
          <p className="sop-body-lg-medium text-sop-neutral-gray-300 md:block hidden">
            สินค้าทั้งหมด {apiProducts?.length}
          </p>
          <div className="md:mt-5 mt-2">
            {!items.length ? (
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
                <ul className="grid md:gap-4 gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
                  {products.map(
                    (hit) =>
                      apiProducts?.find((p: any) => p.id === hit.objectID) && (
                        <ProductCard
                          api_product={apiProducts?.find(
                            (p: any) => p.id === hit.objectID
                          )}
                          key={hit.objectID}
                          product={hit}
                        />
                      )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
