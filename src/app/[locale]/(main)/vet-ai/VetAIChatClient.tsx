"use client"

import { FormEvent, useState } from "react"

import { Input } from "@/components/atoms/InputSOPet/Input"
import { MessageSendIcon, VetAIColoredIcon, VetAIIcon } from "@/icons"
import { sendVetAiMessage } from "@/lib/data/vet-ai"
import { cn } from "@/lib/utils"

type ChatMessage = {
  message: string
  isUser: boolean
}

export const VetAIChatClient = () => {
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string>("")

  const handleSendMessage = async (event?: FormEvent) => {
    event?.preventDefault()

    const trimmed = messageInput.trim()
    if (!trimmed || isSending) {
      return
    }

    setMessageInput("")
    setChatMessages((prev) => [...prev, { message: trimmed, isUser: true }])
    setIsSending(true)

    const result = await sendVetAiMessage(trimmed, {
      conversationId: conversationId || undefined,
      customerId: "storefront_guest",
    })

    setIsSending(false)
    if (result.ok) {
      setConversationId(result.conversationId)
    }
    setChatMessages((prev) => [
      ...prev,
      {
        message: result.ok
          ? result.reply
          : result.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        isUser: false,
      },
    ])
  }

  return (
    <main className="flex-1 min-h-0 w-full md:px-20 flex flex-col overflow-y-auto bg-sop-primary-100">
      <section>
        <header className="flex flex-col items-center p-5 text-center gap-2">
          <VetAIColoredIcon sizeMobile={66} sizeDesktop={100} />
          <span className="sop-body-md-medium md:sop-headline-lg-medium sop-gradient-01 text-transparent bg-clip-text inline-block">
            Vet AI
          </span>
          <span className="sop-headline-sm-medium md:sop-headline-lg-medium">
            วิเคราะห์อาการเบื้องต้น ด้วยระบบ AI
          </span>
        </header>

        <div className="flex flex-col w-full gap-2 p-5 md:p-0 flex-1 mb-24">
          {chatMessages.map((message, index) => (
            <ChatMessage
              key={`${message.message}-${index}`}
              message={message.message}
              isUser={message.isUser}
            />
          ))}
          {isSending && <ChatMessage message="กำลังพิมพ์..." isUser={false} />}
        </div>
      </section>

      <form
        className="fixed bottom-0 left-0 right-0 p-4 px-4 md:px-20 bg-sop-primary-100"
        onSubmit={handleSendMessage}
      >
        <div className="relative">
          <Input
            placeholder="พิมพ์ข้อความ"
            variant="bordered"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 bottom-0 cursor-pointer h-fit flex items-center justify-center aspect-square p-1 disabled:cursor-not-allowed"
          >
            <MessageSendIcon sizeMobile={16} sizeDesktop={16} color="#949495" />
          </button>
        </div>
      </form>
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
