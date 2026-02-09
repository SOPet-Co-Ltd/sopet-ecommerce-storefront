import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string; locale: string }>
}

export default async function EditAddressPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/user/addresses`)
}
