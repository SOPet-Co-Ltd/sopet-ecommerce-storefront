"use client"

import { NativeSelect } from "@/components/common/NativeSelect"
import { useEffect, useMemo, useState } from "react"

export type ThaiAddressValue = {
  province: string
  district: string
  subdistrict: string
  zipCode: string
}

type ThaiAddressSelectProps = {
  value: ThaiAddressValue
  onChange: (value: ThaiAddressValue) => void
  errors?: Record<string, unknown>
}

// Mock Data for demonstration
const THAI_ADDRESS_DATA = [
  {
    province: "กรุงเทพมหานคร",
    districts: [
      {
        amphoe: "วัฒนา",
        subdistricts: [
          { tambon: "คลองเตยเหนือ", zip: "10110" },
          { tambon: "คลองตันเหนือ", zip: "10110" },
          { tambon: "พระโขนงเหนือ", zip: "10110" },
        ],
      },
      {
        amphoe: "คลองเตย",
        subdistricts: [
          { tambon: "คลองเตย", zip: "10110" },
          { tambon: "คลองตัน", zip: "10110" },
          { tambon: "พระโขนง", zip: "10110" },
        ],
      },
      {
        amphoe: "ปทุมวัน",
        subdistricts: [
          { tambon: "รองเมือง", zip: "10330" },
          { tambon: "วังใหม่", zip: "10330" },
          { tambon: "ปทุมวัน", zip: "10330" },
          { tambon: "ลุมพินี", zip: "10330" },
        ],
      },
    ],
  },
  {
    province: "นนทบุรี",
    districts: [
      {
        amphoe: "เมืองนนทบุรี",
        subdistricts: [
          { tambon: "สวนใหญ่", zip: "11000" },
          { tambon: "ตลาดขวัญ", zip: "11000" },
          { tambon: "บางเขน", zip: "11000" },
        ],
      },
      {
        amphoe: "ปากเกร็ด",
        subdistricts: [{ tambon: "ปากเกร็ด", zip: "11120" }],
      },
    ],
  },
]

const ThaiAddressSelect = ({
  value,
  onChange,
  errors,
}: ThaiAddressSelectProps) => {
  const [selectedProvince, setSelectedProvince] = useState(value.province)
  const [selectedDistrict, setSelectedDistrict] = useState(value.district)
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(
    value.subdistrict
  )

  // Sync internal state with props if props change from parent
  useEffect(() => {
    if (value.province !== selectedProvince) setSelectedProvince(value.province)
    if (value.district !== selectedDistrict) setSelectedDistrict(value.district)
    if (value.subdistrict !== selectedSubdistrict)
      setSelectedSubdistrict(value.subdistrict)
  }, [value.province, value.district, value.subdistrict])

  const districts = useMemo(() => {
    return (
      THAI_ADDRESS_DATA.find((p) => p.province === selectedProvince)
        ?.districts || []
    )
  }, [selectedProvince])

  const subdistricts = useMemo(() => {
    return (
      districts.find((d) => d.amphoe === selectedDistrict)?.subdistricts || []
    )
  }, [districts, selectedDistrict])

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value
    setSelectedProvince(newProvince)
    setSelectedDistrict("")
    setSelectedSubdistrict("")
    onChange({
      province: newProvince,
      district: "",
      subdistrict: "",
      zipCode: "",
    })
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value
    setSelectedDistrict(newDistrict)
    setSelectedSubdistrict("")
    onChange({
      province: selectedProvince,
      district: newDistrict,
      subdistrict: "",
      zipCode: "",
    })
  }

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubdistrict = e.target.value
    const zip = subdistricts.find((s) => s.tambon === newSubdistrict)?.zip || ""

    setSelectedSubdistrict(newSubdistrict)
    onChange({
      province: selectedProvince,
      district: selectedDistrict,
      subdistrict: newSubdistrict,
      zipCode: zip,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Province */}
      <NativeSelect
        label="จังหวัด"
        value={selectedProvince}
        onChange={handleProvinceChange}
        placeholder="เลือกจังหวัด"
        errors={errors}
      >
        <option value="">เลือกจังหวัด</option>
        {THAI_ADDRESS_DATA.map((p) => (
          <option key={p.province} value={p.province}>
            {p.province}
          </option>
        ))}
      </NativeSelect>

      {/* District / Amphoe */}
      <NativeSelect
        label="เขต/อำเภอ"
        value={selectedDistrict}
        onChange={handleDistrictChange}
        disabled={!selectedProvince}
        placeholder="เลือกเขต/อำเภอ"
        errors={errors}
      >
        <option value="">เลือกเขต/อำเภอ</option>
        {districts.map((d) => (
          <option key={d.amphoe} value={d.amphoe}>
            {d.amphoe}
          </option>
        ))}
      </NativeSelect>

      {/* Sub-district / Tambon */}
      <NativeSelect
        label="แขวง/ตำบล"
        value={selectedSubdistrict}
        onChange={handleSubdistrictChange}
        disabled={!selectedDistrict}
        placeholder="เลือกตำบล/แขวง"
        errors={errors}
      >
        <option value="">เลือกตำบล/แขวง</option>
        {subdistricts.map((s) => (
          <option key={s.tambon} value={s.tambon}>
            {s.tambon}
          </option>
        ))}
      </NativeSelect>

      {/* Zip Code */}
      <NativeSelect
        label="รหัสไปรษณีย์"
        value={value.zipCode}
        disabled={!value.zipCode}
        placeholder="รหัสไปรษณีย์"
        errors={errors}
      >
        <option value={value.zipCode}>{value.zipCode || "รหัสไปรษณีย์"}</option>
      </NativeSelect>
    </div>
  )
}

export default ThaiAddressSelect
