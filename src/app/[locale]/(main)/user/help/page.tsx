import { UserContainer, SaveQRCodeButton } from "@/components/molecules"
import { cn } from "@/lib/utils"
import Image from "next/image"

const HelpPage = () => {
  return (
    <UserContainer title="ศูนย์ช่วยเหลือ">
      <div
        className={cn("flex flex-col items-center gap-sop-24px py-sop-40px")}
      >
        {/* QR Code */}
        <div className={cn("relative w-[300px] h-[300px]")}>
          <Image
            src="/images/qr/sopet-qr.svg"
            alt="QR Code"
            fill
            className={cn("object-contain")}
            priority
            unoptimized
          />
        </div>

        {/* Save QR Code Button */}
        <SaveQRCodeButton />

        {/* Instructional Text */}
        <p
          className={cn(
            "sop-body-md-regular text-sop-neutral-gray-200 text-center"
          )}
        >
          หากพบปัญหา หรือต้องการติดต่อเจ้าหน้าที่ กรุณาแอดไลน์......
        </p>
      </div>
    </UserContainer>
  )
}

export default HelpPage
