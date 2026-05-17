import { Infotag } from "@/components/atoms/InfoTag/Infotag"
import { Button } from "@/components/atoms"
import { Dot } from "lucide-react"

const AddressFilledState = ({ customer }: any) => {
  const address = customer?.customer?.addresses?.find(
    (a: any) => a.is_default_shipping
  )
  const fullAddress = `${address?.address_1} ${address?.address_2} ${address?.city} ${address?.province} ${address?.postal_code}`
  return (
    <div className="flex justify-between items-center">
      <div className="pr-5.5">
        <div className="flex items-center gap-4">
          <div className="flex  gap-2">
            <label> {customer?.customer?.addresses?.[0].address_name}</label>
            <label>({customer?.customer?.addresses?.[0].phone})</label>
          </div>
          <Infotag
            className="sop-body-sm-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 pr-2.5"
            leftIcon={<Dot size={32} />}
          >
            ค่าเริ่มต้น
          </Infotag>
        </div>
        <label className="sop-body-md-regular">{fullAddress}</label>
      </div>
      <Button type="submit" variant="outline" size="xl" rounded="rounded">
        เปลี่ยน
      </Button>
    </div>
  )
}

export default AddressFilledState
