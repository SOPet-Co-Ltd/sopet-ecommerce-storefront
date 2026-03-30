import { MEDUSA_BACKEND_URL } from "@/lib/config"

const BACKEND_BASE = MEDUSA_BACKEND_URL.replace(/\/$/, "") + "/"

export const getImageUrl = (image: string) => {
  return image
    .replace("http://localhost:9000/", BACKEND_BASE)
    .replace("https://localhost:9000/", BACKEND_BASE)
}
