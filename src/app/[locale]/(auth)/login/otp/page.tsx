import { OtpVerifyForm } from "@/components/molecules/LoginForm/OtpVerifyForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ยืนยัน OTP",
  description: "OTP Verification Page",
}

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string }
}) {
  const phone = searchParams.phone ?? ""
  return <OtpVerifyForm phone={phone} />
}
