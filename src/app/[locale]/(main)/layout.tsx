import { Footer, Header } from "@/components/organisms"
import { verifyCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { Session } from "@talkjs/react"
import { redirect } from "next/navigation"

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID
  const { locale } = await params

  const user = await verifyCustomer()
  const regionCheck = await checkRegion(locale)

  if (!regionCheck) {
    return redirect("/")
  }

  if (!APP_ID || !user)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <Footer />
      </div>
    )

  return (
    <Session appId={APP_ID} userId={user.id}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <Footer />
      </div>
    </Session>
  )
}
