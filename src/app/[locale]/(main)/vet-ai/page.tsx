import { Input } from "@/components/atoms/InputSOPet/Input"
import { MessageSendIcon, VetAIColoredIcon, VetAIIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import type { Metadata } from "next"

type VetAIPageParams = {
  params: {
    locale: string
  }
}

export async function generateMetadata({
  params,
}: VetAIPageParams): Promise<Metadata> {
  const { locale } = params

  return {
    title: "Vet AI | SOPet",
    description: "Vet AI - SOPet",
    openGraph: {
      title: "Vet AI | SOPet",
      description: "Vet AI - SOPet",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/vetai`,
      siteName: "SOPet",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png`,
        },
      ],
    },
  }
}

export default async function VetAIPage({ params }: VetAIPageParams) {
  const { locale } = params

  const chatMessages = [
    {
      message: "Hello, how are you?",
      isUser: true,
    },
    {
      message: "I'm fine, thank you!",
      isUser: false,
    },
    {
      message: "I'm fine, thank you!",
      isUser: true,
    },
    {
      message: "I'm fine, thank you!",
      isUser: false,
    },
    {
      message: "I'm fine, thank you!",
      isUser: true,
    },
  ]

  return (
    <main className="flex-1 min-h-0 w-full md:px-20 flex flex-col overflow-y-auto bg-sop-primary-100">
      {/* NOTE - This section is scrollable */}
      <section>
        {/* NOTE - Section header */}
        <header className="flex flex-col items-center p-5 text-center gap-2">
          <VetAIColoredIcon sizeMobile={66} sizeDesktop={100} />
          <span className="sop-body-md-medium md:sop-headline-lg-medium sop-gradient-01 text-transparent bg-clip-text inline-block">
            Vet AI
          </span>
          <span className="sop-headline-sm-medium md:sop-headline-lg-medium">
            วิเคราะห์อาการเบื้องต้น ด้วยระบบ AI
          </span>
        </header>
        {/* NOTE - Section content */}
        <div className="flex flex-col w-full gap-2 p-5 md:p-0 flex-1 mb-24">
          {chatMessages.map((message, index) => (
            <ChatMessage
              key={`${message}-${index}`}
              message={message.message}
              isUser={message.isUser}
            />
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 px-4 md:px-20 bg-sop-primary-100">
        <div className="relative">
          <Input placeholder="พิมพ์ข้อความ" variant="bordered" />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bottom-0 cursor-pointer h-fit flex items-center justify-center aspect-square p-1">
            <MessageSendIcon sizeMobile={16} sizeDesktop={16} color="#949495" />
          </button>
        </div>
      </div>
    </main>
  )
}

type ChatMessageProps = {
  message: string
  isUser: boolean
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex flex-col w-full",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div className="flex items-start gap-2">
        {!isUser && (
          <div className="flex items-center justify-center aspect-square sop-gradient-01 rounded-full w-[30px] md:w-sop-40px">
            <VetAIIcon sizeMobile={16} sizeDesktop={23} color="#fff" />
          </div>
        )}
        <div
          className={cn(
            "p-3 rounded-lg flex flex-col",
            isUser
              ? "rounded-tr-none bg-sop-primary-500"
              : "rounded-tl-none bg-sop-base-white text-sop-neutral-gray-300"
          )}
        >
          {!isUser && (
            <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-grayfixed-200">
              Vet AI
            </span>
          )}
          <p
            className={cn(
              "md:sop-body-md-regular sop-body-sm-regular",
              isUser ? "text-sop-base-white" : "text-sop-neutral-gray-300"
            )}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
