import { RouteLoadingFallback } from "@/components/atoms/RouteLoadingFallback/RouteLoadingFallback"
import { CouponsPageSkeleton } from "@/components/sections/CouponsPage/CouponsPageSkeleton"

export default function CouponsLoading() {
  return (
    <>
      <RouteLoadingFallback variant="main" />
      <CouponsPageSkeleton />
    </>
  )
}
