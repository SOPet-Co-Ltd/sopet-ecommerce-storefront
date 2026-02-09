"use client"
import { Button, Divider } from "@/components/atoms"
import { Modal, ReportSellerForm } from "@/components/molecules"
import { DoneIcon } from "@/icons"
import { SingleProductSeller } from "@/types/product"
import { SellerProps } from "@/types/seller"
import { format } from "date-fns"
import { useState } from "react"

export const SellerFooter = ({ seller }: { seller: SellerProps }) => {
  const [openModal, setOpenModal] = useState(false)
  return (
    <div className="flex justify-between items-center flex-col lg:flex-row">
      <div className="flex gap-2 lg:gap-4 items-center label-sm lg:label-md text-secondary mb-4 lg:mb-0 justify-between w-full lg:justify-start lg:w-auto">
        {/* {seller.verified && (
          <div className="flex items-center gap-2">
            <DoneIcon size={20} />
            Verified seller
          </div>
        )} */}
        <Divider square />
        <p>Joined {format(seller.created_at, "yyyy-MM-dd")}</p>
        {/* <Divider square /> */}
        {/* <p>sold {seller.sold}</p> */}
      </div>
      <Button className="uppercase" onClick={() => setOpenModal(true)}>
        Report
      </Button>
      {openModal && (
        <Modal
          header={<h2 className="text-primary label-lg">Report seller</h2>}
          onClose={() => setOpenModal(false)}
        >
          <ReportSellerForm onClose={() => setOpenModal(false)} />
        </Modal>
      )}
    </div>
  )
}
