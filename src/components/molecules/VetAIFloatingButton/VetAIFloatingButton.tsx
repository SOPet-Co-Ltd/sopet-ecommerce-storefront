import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { VetAIIcon } from "@/icons"

export const VetAIFloatingButton = () => {
  return (
    <div className="fixed bottom-16 right-16">
      <LocalizedClientLink href="/vat-ai">
        <div className="flex items-center justify-center gap-0.5 flex-col sop-gradient-01 rounded-tl-4xl rounded-bl-4xl rounded-tr-4xl rounded-br-sm aspect-square h-sop-64px">
          <VetAIIcon size={30} color="#fff" />
          <span className="sop-body-xs-regular text-sop-base-white">
            Vat AI
          </span>
        </div>
      </LocalizedClientLink>
    </div>
  )
}
