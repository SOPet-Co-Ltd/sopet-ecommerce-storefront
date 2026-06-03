"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { SellerProps } from "@/types/seller"
import { MessageIcon } from "@/icons"

export const Chat = ({
  user,
  seller,
  buttonClassNames,
  icon,
  product,
  subject,
  order_id,
}: {
  user: HttpTypes.StoreCustomer | null
  seller: SellerProps
  buttonClassNames?: string
  icon?: boolean
  product?: HttpTypes.StoreProduct
  subject?: string
  order_id?: string
}) => {
  const [modal, setModal] = useState(false)

  return (
    <>
      <Button onClick={() => setModal(true)} className={buttonClassNames}>
        {icon ? <MessageIcon size={20} /> : "Write to seller"}
      </Button>
      {modal && (
        <Modal
          header={<h2 className="text-primary label-lg">Chat</h2>}
          onClose={() => setModal(false)}
        >
          <div className="px-4" />
        </Modal>
      )}
    </>
  )
}
