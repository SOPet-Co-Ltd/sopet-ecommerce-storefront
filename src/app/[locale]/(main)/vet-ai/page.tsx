import type { Metadata } from "next"
import { VetAIChatClient } from "./VetAIChatClient"

type VetAIPageParams = {
  params: {
    locale: string
  }
}

export async function generateMetadata({
  params,
}: VetAIPageParams): Promise<Metadata> {
  const { locale } = params

  return {
    title: "Vet AI | SOPet",
    description: "Vet AI - SOPet",
    openGraph: {
      title: "Vet AI | SOPet",
      description: "Vet AI - SOPet",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/vetai`,
      siteName: "SOPet",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png`,
        },
      ],
    },
  }
}

export default async function VetAIPage() {
  return <VetAIChatClient />
}
