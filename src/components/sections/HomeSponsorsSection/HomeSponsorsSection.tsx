import type { StorefrontSponsor } from "@/lib/data/storefront-config"
import { SmartImage } from "@/components/atoms"

type HomeSponsorsSectionProps = {
  heading?: string
  sponsors: StorefrontSponsor[]
}

export const HomeSponsorsSection = ({
  heading = "แบรนด์ที่เข้าร่วม",
  sponsors,
}: HomeSponsorsSectionProps) => {
  return (
    <div className="py-5 px-4 flex flex-col gap-sop-20px">
      <div className="text-center">
        <h2 className="sop-body-lg-medium text-sop-neutral-gray-200 md:sop-headline-md-medium">
          {heading}
        </h2>
      </div>
      <div className="grid w-full grid-cols-2 items-center justify-center gap-4 md:grid-cols-6">
        {sponsors.map((sponsor) => {
          const altText = sponsor.name || "Sponsored"

          const card = (
            <div className="aspect-2/1 w-full max-w-[150px]">
              <SmartImage
                src={sponsor.image_url}
                alt={altText}
                width={200}
                height={100}
                className="h-full w-full object-contain"
              />
            </div>
          )

          if (sponsor.href) {
            return (
              <a
                key={sponsor.id}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                className="flex justify-center"
              >
                {card}
              </a>
            )
          }

          return (
            <div key={sponsor.id} className="flex justify-center">
              {card}
            </div>
          )
        })}
      </div>
    </div>
  )
}
