import { OtpVerifyForm } from "@/components/molecules/LoginForm/OtpVerifyForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ยืนยัน OTP",
  description: "OTP Verification Page",
}

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>
}) {
  const { phone } = await searchParams
  return <OtpVerifyForm phone={phone ?? ""} />
}
