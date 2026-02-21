import { Button } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"

type OrderDetailsSummaryProps = {
  order: any
}

const OrderDetailsSummary = ({ order }: OrderDetailsSummaryProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4">สรุปคำสั่งซื้อ</h3>
      <div className="space-y-3 text-sm border-b border-gray-100 pb-4">
        <div className="flex justify-between text-gray-600">
          <span>ยอดรวมสินค้า</span>
          <span>
            {convertToLocale({
              amount: order.subtotal || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ค่าจัดส่ง</span>
          <span>
            {convertToLocale({
              amount: order.shipping_total || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-green-600">
            <span>ส่วนลด</span>
            <span>
              -
              {convertToLocale({
                amount: order.discount_total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center font-medium text-lg text-gray-900 py-4">
        <span>ยอดสุทธิ</span>
        <span className="text-sop-secondary-500 text-xl font-bold">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
      </div>

      {order.payment_status === "awaiting" && (
        <div className="space-y-3 mt-2">
          <Button className="w-full rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white h-11 text-base">
            ชำระเงิน
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-secondary-50 h-11 text-base"
          >
            แจ้งชำระเงิน
          </Button>
        </div>
      )}
    </div>
  )
}

export default OrderDetailsSummary
