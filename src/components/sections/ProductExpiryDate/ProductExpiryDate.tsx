import { JarOfPillsIcon } from "@/icons"

type ProductExpiryDateProps = {
  dateOfExpired: string | null
}

export const ProductExpiryDate = ({
  dateOfExpired,
}: ProductExpiryDateProps) => {
  if (!dateOfExpired) return null

  return (
    <div className="flex w-full">
      <div className="flex items-center gap-2 bg-sop-primary-100 p-2 rounded-sop-8px w-full">
        <JarOfPillsIcon size={24} />
        <p className="md:sop-body-lg-medium sop-body-md-medium text-sop-primary-700">
          วันหมดอายุ : {dateOfExpired}
        </p>
      </div>
    </div>
  )
}
