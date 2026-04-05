import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPageMetadata({
    locale,
    pathname: `user/orders/${id}/request-success`,
    title: "ส่งคำขอสำเร็จ",
    description: "เราได้รับคำขอของคุณแล้ว และจะดำเนินการต่อไป",
    indexable: false,
  })
}

export default async function RequestSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 text-center">
          <h1 className="heading-md uppercase">Return requested</h1>
          <p className="label-md text-secondary w-96 mx-auto my-8">
            Your return request has been submitted. Once the seller confirms it,
            you will receive a confirmation email.
          </p>
          <LocalizedClientLink href={`/user/returns${id && `?return=${id}`}`}>
            <Button className="label-md uppercase px-12 py-3">
              Return details
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </main>
  )
}
