"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { FooterPhoneIcon, FooterMailIcon } from "@/icons"
import {
  SOCIAL_LINKS,
  COMPANY_INFO,
  FOOTER_MENUS,
  FOOTER_LINKS,
} from "./constants"
import {
  FooterLink,
  FooterMenuColumn,
  FooterMenuList,
  responsiveClasses,
} from "./components"
import { Accordion } from "./Accordion"

// Social media icons using Footer icon components
const SocialMediaLinks = () => {
  return (
    <div className="flex gap-sop-16px items-center">
      {SOCIAL_LINKS.map(({ name, href, Icon }) => (
        <Link key={name} href={href} target="_blank" rel="noopener noreferrer">
          <Icon size={24} />
        </Link>
      ))}
    </div>
  )
}

// Phone button component
const PhoneButton = () => {
  return (
    <button className="bg-sop-primary-500 text-sop-base-white pr-sop-12px pl-sop-8px py-sop-8px rounded-sop-36px flex items-center gap-2 hover:opacity-90 transition-opacity w-fit">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-sop-base-white rounded-full">
        <FooterPhoneIcon size={12} color="#9C6ADE" />
      </span>
      <span className="sop-body-xs-medium text-sop-base-white">
        {COMPANY_INFO.phone}
      </span>
    </button>
  )
}

// QR code and download section
const QRCodeSection = () => {
  return (
    <div className="flex flex-col gap-sop-12px">
      {/* <div
        className="bg-sop-base-white p-sop-8px rounded-sop-16px border border-sop-neutral-gray-100"
        style={{ width: "140px", height: "140px" }}
      >
        <div className="w-full h-full bg-sop-neutral-gray-500 rounded-sop-8px flex items-center justify-center">
          <div className="text-center">
            <div className="text-sop-neutral-gray-300 sop-body-xs-regular">
              QR Code
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-sop-8px w-full">
        <button className="bg-sop-base-black text-sop-base-white sop-body-xs-regular px-sop-8px py-sop-8px rounded-sop-8px hover:opacity-80 transition-opacity">
          App Store
        </button>
        <button className="bg-sop-base-black text-sop-base-white sop-body-xs-regular px-sop-8px py-sop-8px rounded-sop-8px hover:opacity-80 transition-opacity">
          Google Play
        </button>
      </div> */}
    </div>
  )
}

// Reusable contact info section
const ContactInfoSection = ({
  nameFontSize = "sop-body-lg-regular",
  emailFontSize = "sop-body-md-medium",
}: {
  nameFontSize?: string
  emailFontSize?: string
}) => {
  return (
    <div className="flex flex-col gap-sop-28px">
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
      <PhoneButton />
    </div>
  )
}

export const HomeFooterSection = () => {
  return (
    <footer className="bg-sop-base-white w-full">
      <FooterContent />
      <FooterCopyright />
    </footer>
  )
}

const FooterContent = () => {
  return (
    <div
      className={cn(
        "bg-sop-base-white w-full",
        responsiveClasses.desktopPadding
      )}
    >
      {/* Desktop Layout */}
      <div className={cn(responsiveClasses.desktopOnly, "gap-sop-20px")}>
        {/* Contact Info Section */}
        <div className="col-span-2">
          <ContactInfoSection />
        </div>

        {/* Products Menu */}
        <div>
          <FooterMenuList items={FOOTER_MENUS.products} />
        </div>

        {/* Services Menu */}
        <div>
          <FooterMenuColumn
            title={FOOTER_MENUS.services.title}
            links={FOOTER_MENUS.services.links}
          />
        </div>

        {/* About SOPet Menu */}
        <div>
          <FooterMenuColumn
            title={FOOTER_MENUS.about.title}
            links={FOOTER_MENUS.about.links}
          />
        </div>

        {/* App Download Section */}
        <div>
          {/* <div className="flex flex-col gap-sop-24px">
            <FooterSectionHeading>
              {FOOTER_MENUS.download.title}
            </FooterSectionHeading>
            <QRCodeSection />
          </div> */}
        </div>
      </div>

      {/* Tablet Layout */}
      <div className={cn(responsiveClasses.tabletOnly, "gap-sop-32px")}>
        {/* Contact Info Section */}
        <div className="col-span-3">
          <ContactInfoSection
            nameFontSize="sop-body-md-regular"
            emailFontSize="sop-body-sm-medium"
          />
        </div>

        {/* Products Menu */}
        <div>
          <FooterMenuList
            items={FOOTER_MENUS.products}
            linkClassName={`${responsiveClasses.linkClassName.tablet} text-sop-neutral-gray-300 hover:text-sop-base-black transition-colors`}
          />
        </div>

        {/* Services Menu */}
        <div>
          <FooterMenuColumn
            title={FOOTER_MENUS.services.title}
            links={FOOTER_MENUS.services.links}
            linkClassName={`${responsiveClasses.linkClassName.tablet} text-sop-neutral-gray-300 hover:text-sop-base-black transition-colors`}
          />
        </div>

        {/* About SOPet Menu */}
        <div>
          <FooterMenuColumn
            title={FOOTER_MENUS.about.title}
            links={FOOTER_MENUS.about.links}
            linkClassName={`${responsiveClasses.linkClassName.tablet} text-sop-neutral-gray-300 hover:text-sop-base-black transition-colors`}
          />
        </div>

        {/* App Download Section */}
        <div>
          {/* <div className="flex flex-col gap-sop-24px">
            <FooterSectionHeading>
              {FOOTER_MENUS.download.title}
            </FooterSectionHeading>
            <div className="flex flex-col gap-sop-12px">
              <QRCodeSection />
            </div>
          </div> */}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className={responsiveClasses.mobileOnly}>
        {/* Contact Info Section */}
        <div className="flex flex-col gap-sop-20px">
          <ContactInfoSection
            nameFontSize="sop-body-lg-regular"
            emailFontSize="sop-body-md-medium"
          />
        </div>

        {/* Accordion Menus */}
        <div className="pt-sop-20px">
          <div className="flex flex-col">
            {FOOTER_MENUS.products.map(({ label, href }) => (
              <FooterLink
                key={label}
                href={href}
                label={label}
                className={`sop-body-sm-medium py-4 border-b border-sop-neutral-grayalpha-100 text-sop-neutral-gray-100 hover:text-sop-base-black transition-colors`}
              />
            ))}
          </div>

          <Accordion id="services" title={FOOTER_MENUS.services.title}>
            <div className="flex flex-col gap-sop-12px">
              {FOOTER_MENUS.services.links.map(({ label, href }) => (
                <FooterLink
                  key={label}
                  href={href}
                  label={label}
                  className={`${responsiveClasses.linkClassName.mobile} text-sop-neutral-gray-100 hover:text-sop-base-black transition-colors`}
                />
              ))}
            </div>
          </Accordion>

          <Accordion id="about" title={FOOTER_MENUS.about.title}>
            <div className="flex flex-col gap-sop-12px">
              {FOOTER_MENUS.about.links.map(({ label, href }) => (
                <FooterLink
                  key={label}
                  href={href}
                  label={label}
                  className={`${responsiveClasses.linkClassName.mobile} text-sop-neutral-gray-100 hover:text-sop-base-black transition-colors`}
                />
              ))}
            </div>
          </Accordion>
        </div>

        {/* App Download Section */}
        <div className="flex flex-col gap-sop-24px pt-sop-20px">
          {/* <FooterSectionHeading>
            {FOOTER_MENUS.download.title}
          </FooterSectionHeading>
          <QRCodeSection /> */}
        </div>
      </div>
    </div>
  )
}

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
