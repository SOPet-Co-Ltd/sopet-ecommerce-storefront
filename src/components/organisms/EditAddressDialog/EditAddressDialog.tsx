import { HttpTypes } from "@medusajs/types"
import { Button, Input, Checkbox } from "@/components/atoms"
import { useState, useEffect } from "react"
import ThaiAddressSelect, {
  ThaiAddressValue,
} from "@/components/cells/ThaiAddressSelect/ThaiAddressSelect"
import {
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/data/customer"
import { useRouter } from "next/navigation"

interface EditAddressDialogProps {
  isOpen: boolean
  onClose: () => void
  address: HttpTypes.StoreCustomerAddress | null // null = new address
  onSuccess: () => void
}

export const EditAddressDialog = ({
  isOpen,
  onClose,
  address,
  onSuccess,
}: EditAddressDialogProps) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_1: "",
    address_2: "",
    city: "", // district/amphoe
    province: "",
    postal_code: "",
    country_code: "th",
    is_default_shipping: false,
    address_name: "Shipping",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setFormData({
        first_name: address.first_name || "",
        last_name: address.last_name || "",
        phone: address.phone || "",
        address_1: address.address_1 || "",
        address_2: address.address_2 || "",
        city: address.city || "",
        province: address.province || "",
        postal_code: address.postal_code || "",
        country_code: address.country_code || "th",
        is_default_shipping: address.is_default_shipping || false,
        address_name: address.address_name || "Shipping",
      })
    } else {
      // Reset for new address with empty values
      setFormData({
        first_name: "",
        last_name: "",
        phone: "",
        address_1: "",
        address_2: "",
        city: "",
        province: "",
        postal_code: "",
        country_code: "th",
        is_default_shipping: false,
        address_name: "Shipping",
      })
    }
    setError(null)
  }, [address, isOpen])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleThaiAddressChange = (value: ThaiAddressValue) => {
    setFormData((prev) => ({
      ...prev,
      province: value.province,
      city: value.district,
      address_2: value.subdistrict,
      postal_code: value.zipCode,
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const payload = new FormData()
    // Manual mapping because Server Actions expect FormData
    payload.append("first_name", formData.first_name)
    payload.append("last_name", formData.last_name || "-") // Medusa often requires last_name
    payload.append("phone", formData.phone)
    payload.append("address_1", formData.address_1)
    payload.append("address_2", formData.address_2)
    payload.append("city", formData.city)
    payload.append("province", formData.province)
    payload.append("postal_code", formData.postal_code)
    payload.append("country_code", "th")
    payload.append("company", "")
    payload.append("address_name", formData.address_name)
    if (formData.is_default_shipping) {
      payload.append("isDefaultShipping", "true")
    }

    try {
      if (address) {
        payload.append("addressId", address.id)
        const res = await updateCustomerAddress(payload)
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await addCustomerAddress(payload)
        if (!res.success) throw new Error(res.error)
      }
      onSuccess()
      onClose()
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!address) return
    if (!confirm("Are you sure you want to delete this address?")) return

    setIsLoading(true)
    try {
      await deleteCustomerAddress(address.id)
      onSuccess()
      onClose()
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[600px] bg-white rounded-3xl p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-purple-600 mb-6">
          {address ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
        </h2>

        <div className="space-y-4">
          <Input
            title="ชื่อ-นามสกุล ผู้รับสินค้า"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="ชื่อ-นามสกุล"
          />
          <Input
            title="เบอร์โทรศัพท์"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="099-999-9999"
          />

          <p className="text-gray-900 font-medium">
            จังหวัด / เขต / แขวง / รหัสไปรษณีย์
          </p>
          <ThaiAddressSelect
            value={{
              province: formData.province,
              district: formData.city,
              subdistrict: formData.address_2,
              zipCode: formData.postal_code,
            }}
            onChange={handleThaiAddressChange}
          />

          <Input
            title="ที่อยู่ (บ้านเลขที่ / ซอย / หมู่ / ถนน)"
            name="address_1"
            value={formData.address_1}
            onChange={handleChange}
            placeholder="บ้านเลขที่ / ซอย / หมู่ / ถนน"
          />

          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              id="is_default"
              name="is_default_shipping"
              checked={formData.is_default_shipping}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_default_shipping: e.target.checked,
                })
              }
            />
            <label htmlFor="is_default" className="text-sm cursor-pointer">
              ตั้งเป็นค่าเริ่มต้น
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="mt-6 flex gap-4">
            {address && (
              <Button
                variant="secondary"
                className="w-full rounded-full border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={handleDelete}
                disabled={isLoading}
              >
                ลบ
              </Button>
            )}
            <Button
              className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
