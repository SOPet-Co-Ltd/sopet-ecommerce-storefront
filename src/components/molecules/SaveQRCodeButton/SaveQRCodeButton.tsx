"use client"

import { Button } from "@/components/atoms"
import { cn } from "@/lib/utils"

export function SaveQRCodeButton() {
  const handleSaveQRCode = async () => {
    try {
      // Fetch the QR code image
      const response = await fetch("/images/qr/sopet-qr.jpeg")
      if (!response.ok) {
        throw new Error("Failed to fetch QR code image")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a link element to download the QR code
      const link = document.createElement("a")
      link.href = url
      link.download = "sopet-qr.jpeg"
      link.style.display = "none"
      link.setAttribute("download", "sopet-qr.jpeg")
      document.body.appendChild(link)

      // Trigger download
      link.click()

      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading QR code:", error)
      // Fallback: try direct download approach
      try {
        const link = document.createElement("a")
        link.href = "/images/qr/sopet-qr.jpeg"
        link.download = "sopet-qr.jpeg"
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError)
        // Last resort: open in new tab
        window.open("/images/qr/sopet-qr.jpeg", "_blank")
      }
    }
  }

  return (
    <Button
      variant="outline"
      rounded="rounded"
      onClick={handleSaveQRCode}
      className={cn(
        "border-sop-secondary-500 text-sop-secondary-500",
        "hover:bg-sop-secondary-100",
        "min-w-[200px]"
      )}
    >
      บันทึก QR Code
    </Button>
  )
}
