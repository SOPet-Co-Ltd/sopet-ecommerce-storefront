import { cn } from "@/lib/utils"
import Link from "next/link"
import { FooterMailIcon } from "@/icons"
import {
  SOCIAL_LINKS,
  COMPANY_INFO,
  FOOTER_MENUS,
  FOOTER_LINKS,
} from "./constants"
import { FooterSectionHeading, responsiveClasses } from "./components"
import Image from "next/image"

const SocialMediaLinks = () => (
  <div className="flex gap-sop-16px items-center">
    {SOCIAL_LINKS.map(({ name, href, Icon }) => (
      <Link key={name} href={href} target="_blank" rel="noopener noreferrer">
        <Icon size={24} />
      </Link>
    ))}
  </div>
)

// LINE OA QR code for app download — image dimensions match the white background container
const QRCodeSection = () => (
  <div
    className="bg-sop-base-white"
    style={{ width: "180px", height: "180px" }}
  >
    <Image
      src="/images/qr/LINE_OC_INVITE_QR.png"
      alt="LINE OA QR Code"
      width={1800}
      height={1800}
      loading="lazy"
    />
  </div>
)

// Renders company address, email link, and social icons.
// Font size props allow each breakpoint layout to tune typography independently.
const ContactInfoSection = ({
  nameFontSize = "sop-body-lg-regular",
  emailFontSize = "sop-body-md-medium",
}: {
  nameFontSize?: string
  emailFontSize?: string
}) => (
  <div className="flex flex-col gap-sop-20px">
    <p className={`${nameFontSize} text-sop-base-black`}>
      {COMPANY_INFO.name}
      <br />
      {COMPANY_INFO.address}
      <br />
      {COMPANY_INFO.district}
    </p>
    <Link href={`mailto:${COMPANY_INFO.email}`}>
      <div className="flex gap-2 items-center">
        <FooterMailIcon size={21} />
        <p className={`${emailFontSize} text-sop-base-black`}>
          {COMPANY_INFO.email}
        </p>
      </div>
    </Link>
    <SocialMediaLinks />
  </div>
)

export const HomeFooterSection = () => {
  return (
    <footer className="bg-sop-base-white w-full">
      <FooterContent />
      <FooterCopyright />
    </footer>
  )
}

const FooterContent = () => (
  <div
    className={cn(
      "bg-sop-base-white w-full bg-pattern-dog-paw relative",
      responsiveClasses.desktopPadding
    )}
  >
    <div
      className={cn(
        "grid sm:grid-cols-1 lg:grid-cols-[1fr_auto] gap-sop-20px",
        "gap-sop-20px"
      )}
    >
      <div className="">
        <ContactInfoSection />
      </div>

      <div className="flex flex-col col-span-1 ">
        <div className="flex flex-col mb-sop-24px">
          <FooterSectionHeading>
            {FOOTER_MENUS.line_oa.title[0]}
          </FooterSectionHeading>
          <FooterSectionHeading>
            {FOOTER_MENUS.line_oa.title[1]}
          </FooterSectionHeading>
        </div>
        <QRCodeSection />
        <div>
          <Image
            src="/images/footer/LINE_OA.svg"
            alt="LINE OA QR Code"
            width={180}
            height={180}
          />
        </div>
      </div>
    </div>
  </div>
)

const FooterCopyright = () => {
  return (
    <div
      className={cn(
        "flex items-center w-full",
        "px-sop-16px py-sop-16px md:px-sop-32px lg:px-sop-80px",
        "flex-col md:flex-row gap-sop-12px md:justify-between"
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-sop-primary-500) 0%, var(--color-sop-secondary-500) 100%)",
      }}
    >
      <p className="sop-body-xs-regular text-sop-base-white text-center md:text-left">
        {COMPANY_INFO.copyright}
      </p>
      <div className="flex gap-sop-12px items-center">
        {FOOTER_LINKS.map(({ label, href }, index) => (
          <div key={label} className="flex gap-sop-12px items-center">
            <Link
              href={href}
              className="sop-body-xs-regular text-sop-base-white hover:opacity-80 transition-opacity"
            >
              {label}
            </Link>
            {index < FOOTER_LINKS.length - 1 && (
              <div className="w-px h-4 bg-sop-neutral-whitealpha-400"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
