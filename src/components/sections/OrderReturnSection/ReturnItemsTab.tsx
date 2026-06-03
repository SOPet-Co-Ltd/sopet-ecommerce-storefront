import { Card } from "@/components/atoms/Card/Card"
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox"
import { convertToLocale } from "@/lib/helpers/money"
import Image from "next/image"
import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import { toSearchOption } from "@/lib/helpers/searchable-option"
import type {
  OrderDetails,
  OrderLineItem,
  ReturnReason,
  ReturnRequestLineItemInput,
} from "@/types/order"

export const ReturnItemsTab = ({
  order,
  selectedItems,
  handleSelectItem,
  returnReasons,
  error,
}: {
  order: OrderDetails
  selectedItems: ReturnRequestLineItemInput[]
  handleSelectItem: (item: OrderLineItem, reason_id: string) => void
  returnReasons: ReturnReason[]
  error: boolean
}) => {
  const reasonOptions = returnReasons.map((reason) =>
    toSearchOption(reason.label, reason.id)
  )

  return (
    <div>
      <Card className="bg-secondary p-4">
        <p className="label-md">
          Seller:{" "}
          <span className="font-semibold">{order.seller?.name ?? "-"}</span>
        </p>
      </Card>
      <Card className="flex items-center justify-between p-4">
        <ul className="w-full">
          {order.items.map((item) => (
            <li key={item.id} className="md:flex justify-between gap-2 w-full">
              <div className="flex items-center gap-2 md:w-2/3 mb-4 md:mb-0">
                <Checkbox
                  checked={selectedItems.some(
                    (i) => i.line_item_id === item.id
                  )}
                  onChange={() => handleSelectItem(item, "")}
                />
                <div className="flex items-center gap-2">
                  <div className="w-16 rounded-xs border">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.subtitle ?? item.title}
                        width={64}
                        height={64}
                        className="rounded-xs"
                      />
                    ) : (
                      <Image
                        src={"/images/placeholder.svg"}
                        alt={item.subtitle ?? item.title}
                        width={64}
                        height={64}
                        className="opacity-25 scale-75"
                      />
                    )}
                  </div>
                  <div>
                    <p className="label-md font-semibold text-primary truncate w-full">
                      {item.subtitle}
                    </p>
                    <p className="label-md truncate w-full">{item.title}</p>
                    <p className="label-lg mt-2">
                      {convertToLocale({
                        amount: item.subtotal,
                        currency_code: order.currency_code,
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 relative">
                <SearchableSelect
                  value={
                    selectedItems.find((i) => i.line_item_id === item.id)
                      ?.reason_id ?? ""
                  }
                  onChange={(value) => handleSelectItem(item, value || "")}
                  options={reasonOptions}
                  placeholder="Select Reason"
                  hideTitle
                  isRequire={false}
                  error={
                    error &&
                    !selectedItems.find((i) => i.line_item_id === item.id)
                      ?.reason_id
                      ? { message: "Please select reason" }
                      : undefined
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
