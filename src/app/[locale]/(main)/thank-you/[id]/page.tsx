import { Button } from "@/components/atoms/Button/Button"
import { ThankYouRecommendedProductSection } from "@/components/sections/ThankYouRecommendedProductSection/ThankYouRecommendedProductSection"
import { BigCheckIcon } from "@/icons"
import { getSessionCustomer } from "@/lib/data/customer"
import { cn } from "@/lib/utils"
import Image from "next/image"

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export default async function ThankYouPage(props: Props) {
  const { id, locale } = await props.params
  const customer = await getSessionCustomer()
  const isGuest = !customer
  return (
    <section className="min-h-dvh flex flex-col bg-sop-primary-100">
      <div className="h-[400px] bg-sop-primary-500 overflow-hidden relative">
        {/* Image for mobile and desktop */}

        <Image
          src="/images/thank-you/sop-thankyou-effect-1.webp"
          alt="Thank you effect 1"
          width={204}
          height={384}
          className={cn(
            "absolute object-cover w-[204px] h-[384px]",
            "top-sop-80px md:top-sop-24px",
            "left-[20px]",
            "md:left-[120px]"
          )}
        />

        <Image
          src="/images/thank-you/sop-thankyou-effect-2.webp"
          alt="Thank you effect 2"
          width={204}
          height={384}
          className={cn(
            "absolute object-cover w-[204px] h-[384px]",
            "top-sop-80px md:top-sop-24px",
            "right-[20px]",
            "md:right-[120px]"
          )}
        />

        <Image
          src="/images/thank-you/sop-thankyou-text.webp"
          alt="Thank you dog"
          width={228}
          height={58}
          className="md:w-[228px] md:h-sop-64px w-[228px] h-sop-64px object-cover absolute left-1/2 -translate-x-1/2 md:top-sop-24px top-sop-80px"
        />
        <div className="w-[6600px] bg-sop-primary-100 aspect-square rounded-full overflow-hidden absolute left-1/2 -translate-x-1/2 top-[312px]" />
        <Image
          src="/images/thank-you/sop-thankyou-dog.webp"
          alt="Thank you dog"
          width={660}
          height={290}
          className="md:w-[660px] md:h-[290px] w-[560px] h-[190px] object-cover absolute left-1/2 -translate-x-1/2 md:bottom-sop-20px bottom-sop-32px"
        />
      </div>
      <div className="mb-20">
        <div className="w-full flex flex-col justify-center items-center gap-5">
          <div className="flex items-center justify-center aspect-square bg-sop-additionalgreen-500 w-sop-80px h-sop-80px rounded-full">
            <BigCheckIcon size={30} color="#FFFFFF" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="sop-body-lg-medium text-sop-neutral-gray-200">
              ขอบคุณสำหรับคำสั่งซื้อ
            </span>
            <div>
              <span className="sop-body-lg-medium text-sop-neutral-gray-200">
                รหัสคำสั่งซื้อ :{" "}
              </span>
              <span className="sop-body-lg-medium text-sop-secondary-500">
                {id}
              </span>
            </div>
            <span className="sop-body-md-regular text-sop-neutral-gray-300">
              เราได้รับข้อมูลคำสั่งซื้อของคุณเรียบร้อยแล้ว
            </span>
          </div>
          {isGuest && (
            <a href={`/${locale}/login`} className="w-full max-w-[230px]">
              <Button size="lg" fill className="max-w-[230px]">
                สมัครสมาชิกกับ Sopet ?
              </Button>
            </a>
          )}
          <a
            href="https://line.me/R/ti/p/@sopet"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[230px]"
          >
            <Button
              size="lg"
              fill
              className="bg-sop-system-success-500 hover:bg-sop-system-success-400 max-w-[230px]"
            >
              ติดตามการสั่งซื้อผ่าน LINE OA
            </Button>
          </a>
        </div>
      </div>
      <div className="w-full md:px-20 px-4 md:py-0 py-4 mb-20">
        <ThankYouRecommendedProductSection
          heading="สินค้าที่คุณอาจสนใจ"
          locale="th"
        />
      </div>
    </section>
  )
}
