"use client"

import { useEffect, useMemo, useState, Fragment } from "react"
import { Listbox, Transition } from "@headlessui/react"
import { Check, ChevronDown } from "lucide-react"
import { clx } from "@medusajs/ui"

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

type CommonSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  errors?: Record<string, unknown>
}

const CommonSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  errors,
}: CommonSelectProps) => {
  const selectedOption = options.find((o) => o.value === value)

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="flex flex-col w-full relative">
        {label && (
          <span className="text-small-regular text-ui-fg-base mb-1">
            {label}
          </span>
        )}
        <div className="relative mt-1">
          <Listbox.Button
            className={clx(
              "relative w-full cursor-default rounded-md bg-white py-2.5 pl-4 pr-10 text-left border focus:outline-hidden sm:text-sm transition-all",
              errors ? "border-ui-border-error" : "border-ui-border-base",
              disabled
                ? "bg-gray-50 opacity-50 cursor-not-allowed"
                : "hover:bg-ui-bg-field-hover bg-ui-bg-field"
            )}
          >
            <span
              className={clx(
                "block truncate text-base-regular",
                !value && "text-ui-fg-subtle"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-4 w-4 text-ui-fg-subtle"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden sm:text-sm">
              {options.map((option, optionIdx) => (
                <Listbox.Option
                  key={optionIdx}
                  className={({ active, selected }) =>
                    clx(
                      "relative cursor-pointer select-none py-2 pl-4 pr-4",
                      active || selected
                        ? "bg-purple-50 text-purple-900"
                        : "text-gray-900"
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span
                        className={clx(
                          "block truncate",
                          selected
                            ? "font-medium text-purple-700"
                            : "font-normal"
                        )}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="flex items-center text-purple-600">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </div>
    </Listbox>
  )
}

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

  // Sync internal state with props
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

  const handleProvinceChange = (newProvince: string) => {
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

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict)
    setSelectedSubdistrict("")
    onChange({
      province: selectedProvince,
      district: newDistrict,
      subdistrict: "",
      zipCode: "",
    })
  }

  const handleSubdistrictChange = (newSubdistrict: string) => {
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
      <CommonSelect
        label="จังหวัด"
        value={selectedProvince}
        onChange={handleProvinceChange}
        placeholder="เลือกจังหวัด"
        errors={errors}
        options={THAI_ADDRESS_DATA.map((p) => ({
          label: p.province,
          value: p.province,
        }))}
      />

      {/* District / Amphoe */}
      <CommonSelect
        label="เขต/อำเภอ"
        value={selectedDistrict}
        onChange={handleDistrictChange}
        placeholder="เลือกเขต/อำเภอ"
        disabled={!selectedProvince}
        errors={errors}
        options={districts.map((d) => ({
          label: d.amphoe,
          value: d.amphoe,
        }))}
      />

      {/* Sub-district / Tambon */}
      <CommonSelect
        label="แขวง/ตำบล"
        value={selectedSubdistrict}
        onChange={handleSubdistrictChange}
        placeholder="เลือกตำบล/แขวง"
        disabled={!selectedDistrict}
        errors={errors}
        options={subdistricts.map((s) => ({
          label: s.tambon,
          value: s.tambon,
        }))}
      />

      {/* Zip Code - Keep as CommonSelect for consistency or use Input/NativeSelect equivalent?
         Zip code is auto-filled usually, but maybe editable. user asks for "modal/dialog" style, zip code usually isn't a select list unless choices exist.
         But `NativeSelect` was used before with 1 option.
      */}
      <CommonSelect
        label="รหัสไปรษณีย์"
        value={value.zipCode}
        onChange={() => {}}
        disabled={!value.zipCode}
        placeholder="รหัสไปรษณีย์"
        errors={errors}
        options={
          value.zipCode ? [{ label: value.zipCode, value: value.zipCode }] : []
        }
      />
    </div>
  )
}

export default ThaiAddressSelect
