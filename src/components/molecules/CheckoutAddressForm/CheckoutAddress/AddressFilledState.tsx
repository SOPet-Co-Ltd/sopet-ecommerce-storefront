import { Infotag } from "@/components/atoms/InfoTag/Infotag"
import { Button } from "@/components/atoms"
import { Dot } from "lucide-react"
import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"
import { isMobile } from "@/lib/utils/is-mobile"

const AddressFilledState = ({
  customer,
}: {
  customer: StoreCustomer | null
}) => {
  const address = customer?.addresses?.find(
    (a: StoreCustomerAddress) => a.is_default_shipping
  )

  const fullAddress = `${address?.address_1} ${address?.address_2} ${address?.city} ${address?.province} ${address?.postal_code}`

  return isMobile() ? (
    <div className="flex gap-3">
      <div className="pr-5.5">
        <div className="flex flex-col">
          <div className="flex gap-2">
            <label>{address?.address_name}</label>
            <label>({address?.phone})</label>
          </div>
          <label className="sop-body-md-regular">{fullAddress}</label>
          <div className="item-center justify-between flex mt-sop-16px">
            <Infotag
              className="sop-body-sm-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 pr-2.5"
              leftIcon={<Dot size={32} />}
            >
              ค่าเริ่มต้น
            </Infotag>
            <Button type="submit" variant="outline" size="xl" rounded="rounded">
              เปลี่ยน
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-between items-center">
      <div className="pr-5.5">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <label>{address?.address_name}</label>
            <label>({address?.phone})</label>
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
