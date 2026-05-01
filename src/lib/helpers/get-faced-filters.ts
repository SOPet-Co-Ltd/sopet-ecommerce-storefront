import { FacetFilters } from "algoliasearch/lite"
import { ReadonlyURLSearchParams } from "next/navigation"

const getOption = (label: string) => {
  switch (label) {
    case "size":
      return "variants.size"
    case "color":
      return "variants.color"
    case "condition":
      return "variants.condition"
    case "rating":
      return "average_rating"
    case "pet_type":
      return "custom_tags_pet_type"
    case "brand":
      return "custom_tags_brand"
    default:
      return ""
  }
}

export const getFacedFilters = (filters: ReadonlyURLSearchParams): string => {
  let facet = ""

  let query = ""
  let rating = ""

  for (const [key, value] of filters.entries()) {
    if (
      key !== "min_price" &&
      key !== "max_price" &&
      key !== "sale" &&
      key !== "query" &&
      key !== "page" &&
      key !== "products[page]" &&
      key !== "sortBy" &&
      key !== "rating"
    ) {
      let values = ""
      const splittedSize = value.split(",")
      if (splittedSize.length > 1) {
        splittedSize.map(
          (value, index) =>
            (values += `${getOption(key)}:"${value}" ${
              index + 1 < splittedSize.length ? "OR " : ""
            }`)
        )
      } else {
        values += `${getOption(key)}:"${splittedSize[0]}"`
      }
      facet += ` AND ${values}`
    } else {
      if (key === "query") query = ` AND products.title:"${value}"`

      if (key === "rating") {
        let values = ""
        const splited = value.split(",")
        if (splited.length > 1) {
          splited.map(
            (value, index) =>
              (values += `${getOption(key)} >= ${value} ${
                index + 1 < splited.length ? "OR " : ""
              }`)
          )
        } else {
          values += `${getOption(key)} >=${splited[0]}`
        }
        rating += ` AND ${values}`
      }
    }
  }
  return facet + rating
}
