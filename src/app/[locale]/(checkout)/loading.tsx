import { RouteLoadingSpinnerBlock } from "@/components/atoms/RouteLoadingFallback/RouteLoadingSpinnerBlock"

export default function CheckoutSegmentLoading() {
  return (
    <main className="lg:px-16 px-0 lg:py-4 flex flex-col gap-4 min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RouteLoadingSpinnerBlock variant="main" />
      </div>
    </main>
  )
}
