import { cn } from "@/lib/utils"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"
import { getUserFavorites } from "@/lib/data/favorites"
import { ProductCard } from "@/components/organisms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Button } from "@/components/atoms"
import { isEmpty } from "lodash"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/favorites",
    title: "สินค้าที่ชอบ",
    description: "สินค้าที่คุณกดถูกใจจากการเลือกซื้อบน Sopet",
    indexable: false,
  })
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const user = await verifyCustomer()

  if (!user) {
    redirect("/user")
  }

  const { locale } = await params
  const products = await getUserFavorites(locale)
  const count = products.length

  return (
    <>
      <header
        className={cn(
          "px-sop-16px border-b border-sop-neutral-grayalpha-300 mb-sop-20px flex justify-between items-center h-[42px]"
        )}
      >
        <h2 className="sop-headline-sm-medium">รายการโปรด</h2>
      </header>
      <div className="px-sop-16px">
        {isEmpty(products) ? (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <h2 className="sop-headline-md-medium text-sop-neutral-gray-300 mb-2">
              รายการโปรดของคุณว่างเปล่า
            </h2>
            <p className="sop-body-lg-regular text-sop-neutral-gray-300 mb-6">
              เริ่มเพิ่มสินค้าที่คุณชอบลงในรายการโปรด
            </p>
            <LocalizedClientLink href="/categories">
              <Button>ค้นหาสินค้า</Button>
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <ul className="grid md:gap-4 gap-2 justify-items-start grid-cols-[repeat(auto-fit,minmax(165px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(223px,1fr))]">
                {products.map((product) => {
                  // Create minimal product object for ProductCard
                  // ProductCard expects product prop with title, handle, thumbnail
                  const productForCard = {
                    title: product.title,
                    handle: product.handle,
                    thumbnail: product.thumbnail,
                    id: product.id,
                  }

                  return (
                    <ProductCard
                      api_product={product}
                      key={product.id}
                      product={productForCard}
                    />
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
