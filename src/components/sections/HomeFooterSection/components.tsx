import Link from "next/link"

interface FooterLinkProps {
  href: string
  label: string
  className?: string
}

export const FooterLink = ({
  href,
  label,
  className = "sop-body-md-light text-sop-neutral-gray-300 hover:text-sop-base-black transition-colors",
}: FooterLinkProps) => (
  <Link href={href} className={className}>
    {label}
  </Link>
)

interface FooterSectionHeadingProps {
  children: string
}

export const FooterSectionHeading = ({
  children,
}: FooterSectionHeadingProps) => (
  <h4 className="sop-body-lg-medium text-sop-base-black">{children}</h4>
)

interface FooterMenuColumnProps {
  title: string
  links: Array<{ label: string; href: string }>
  linkClassName?: string
}

export const FooterMenuColumn = ({
  title,
  links,
  linkClassName = "sop-body-md-light text-sop-neutral-gray-300 hover:text-sop-base-black transition-colors",
}: FooterMenuColumnProps) => (
  <div className="flex flex-col gap-sop-24px">
    <FooterSectionHeading>{title}</FooterSectionHeading>
    <div className="flex flex-col gap-sop-12px">
      {links.map(({ label, href }) => (
        <FooterLink
          key={label}
          href={href}
          label={label}
          className={linkClassName}
        />
      ))}
    </div>
  </div>
)

interface FooterMenuListProps {
  items: Array<{ label: string; href: string }>
  linkClassName?: string
}

export const FooterMenuList = ({
  items,
  linkClassName = "sop-body-lg-medium text-sop-base-black hover:text-sop-neutral-gray-300 transition-colors",
}: FooterMenuListProps) => (
  <div className="flex flex-col gap-sop-24px">
    {items.map(({ label, href }) => (
      <FooterLink
        key={label}
        href={href}
        label={label}
        className={linkClassName}
      />
    ))}
  </div>
)

export const responsiveClasses = {
  desktopOnly: "hidden lg:grid lg:grid-cols-5",
  tabletOnly: "hidden md:grid md:grid-cols-3 lg:hidden",
  mobileOnly: "md:hidden",
  desktopPadding:
    "px-sop-16px py-sop-48px md:px-sop-32px md:py-sop-40px lg:px-sop-80px lg:py-sop-48px",
  linkClassName: {
    desktop: "sop-body-md-light",
    tablet: "sop-body-sm-light",
    mobile: "sop-body-sm-light",
  },
}
