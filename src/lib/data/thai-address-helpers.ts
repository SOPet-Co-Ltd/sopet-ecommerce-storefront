import { THAI_ADDRESS } from "@/data/thaiAddress"

export type ProvinceOption = {
  value: string
  label: string
  provinceCode: number
}
export type DistrictOption = {
  value: string
  label: string
  amphoeCode: number
}
export type SubdistrictOption = {
  value: string
  label: string
  postalCode: string
  districtCode: number
}

export function getProvinces(): ProvinceOption[] {
  const seen = new Set<string>()
  const result: ProvinceOption[] = []
  for (const row of THAI_ADDRESS) {
    if (seen.has(row.province)) continue
    seen.add(row.province)
    result.push({
      value: row.province,
      label: row.province,
      provinceCode: Number(row.province_code),
    })
  }
  result.sort((a, b) => a.label.localeCompare(b.label))
  return result
}

export function getDistricts(provinceValue: string): DistrictOption[] {
  if (!provinceValue) return []
  const rows = THAI_ADDRESS.filter((i) => i.province === provinceValue)
  const seen = new Set<string>()
  const result: DistrictOption[] = []
  for (const row of rows) {
    if (seen.has(row.amphoe)) continue
    seen.add(row.amphoe)
    result.push({
      value: row.amphoe,
      label: row.amphoe,
      amphoeCode: Number(row.amphoe_code),
    })
  }
  result.sort((a, b) => a.label.localeCompare(b.label))
  return result
}

export function getSubdistrictsWithPostal(
  provinceValue: string,
  districtValue: string
): SubdistrictOption[] {
  if (!provinceValue || !districtValue) return []
  const rows = THAI_ADDRESS.filter(
    (i) => i.province === provinceValue && i.amphoe === districtValue
  )
  return rows.map((item) => ({
    value: String(item.district_code),
    label: item.district,
    postalCode: String(item.zipcode),
    districtCode: Number(item.district_code),
  }))
}
