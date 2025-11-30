import { MarkdownRender } from "@/components/atoms"

type ProductDetailDescriptionProps = {
  description: string | null | undefined
}

export const ProductDetailDescription = ({
  description,
}: ProductDetailDescriptionProps) => {
  if (!description) return null

  return (
    <div className="bg-sop-base-white gap-4 p-4 md:rounded-lg rounded-none md:mt-5 mt-2">
      <div className="border-b mb-4 py-2 border-sop-primary-500">
        <p className="sop-headline-md-medium text-sop-primary-700">
          รายละเอียดสินค้า
        </p>
      </div>
      <div>
        <div className="">
          <MarkdownRender source={description} />
        </div>
      </div>
    </div>
  )
}
