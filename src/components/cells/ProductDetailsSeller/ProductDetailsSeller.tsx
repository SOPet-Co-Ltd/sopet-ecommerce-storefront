import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { SellerInfo } from "@/components/molecules"
import { SellerProps } from "@/types/seller"

export const ProductDetailsSeller = ({ seller }: { seller?: SellerProps }) => {
  if (!seller) return null

  return (
    <div className="md:mt-5 mt-2 bg-sop-base-white px-4 py-5 md:rounded-lg rounded-none">
      <LocalizedClientLink href={`/sellers/${seller.handle}`}>
        <div className="flex justify-between">
          <SellerInfo seller={seller} />
        </div>
      </LocalizedClientLink>
    </div>
  )
}
