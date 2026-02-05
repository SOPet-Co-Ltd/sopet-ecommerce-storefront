"use client"

import { Button } from "@/components/atoms"
import { useState } from "react"
import { Modal } from "../Modal/Modal"
import { ReportListingForm } from "../ReportListingForm/ReportListingForm"

export const ProductReportButton = () => {
  const [openModal, setOpenModal] = useState(false)
  return (
    <>
      <Button
        className="uppercase label-md"
        variant="default"
        onClick={() => setOpenModal(true)}
      >
        Report listing
      </Button>
      {openModal && (
        <Modal
          header={<h2 className="text-primary label-lg">Report listing</h2>}
          onClose={() => setOpenModal(false)}
        >
          <ReportListingForm onClose={() => setOpenModal(false)} />
        </Modal>
      )}
    </>
  )
}
