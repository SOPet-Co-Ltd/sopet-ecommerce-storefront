"use client"
import { useState } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { requestOtp, verifyOtpAndLogin } from "@/lib/data/customer"
import { initiateOAuth } from "@/lib/data/oauth"
import {
  SOPetLogo,
  FacebookCustomIcon,
  GoogleIcon,
  LineCustomIcon,
} from "@/icons"
import { useRouter } from "next/navigation"

export const RegisterForm = () => {
  return <Form />
}

const Form = () => {
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [otpRequested, setOtpRequested] = useState(false)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const router = useRouter()

  const isValidEmailOrPhone = (value: string | null | undefined): boolean => {
    if (!value || value.trim() === "") {
      return false
    }

    const trimmedValue = value.trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const phoneRegex = /^(\+?66|0)[0-9]{9,10}$/

    return (
      emailRegex.test(trimmedValue) ||
      phoneRegex.test(trimmedValue.replace(/\s+/g, ""))
    )
  }

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์")
      return
    }

    setIsRequestingOtp(true)
    setError(undefined)

    const formData = new FormData()
    formData.append("identifier", identifier.trim().toLowerCase())

    const res = await requestOtp(formData)
    if (res) {
      setError(res)
      setIsRequestingOtp(false)
      return
    }

    setOtpRequested(true)
    setIsRequestingOtp(false)
  }

  const handleVerifyAndLogin = async () => {
    if (!identifier.trim()) {
      setError("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์")
      return
    }
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setError("กรุณากรอก OTP 6 หลักให้ถูกต้อง")
      return
    }

    setIsVerifying(true)
    setError(undefined)

    const formData = new FormData()
    formData.append("identifier", identifier.trim().toLowerCase())
    formData.append("otp", otp.trim())

    const res = await verifyOtpAndLogin(formData)
    if (res) {
      setError(res)
      setIsVerifying(false)
      return
    }

    setIsVerifying(false)
    router.push("/user")
  }

  return (
    <main className="flex justify-center items-center h-full p-4 ">
      <div className="space-y-sop-40px md:max-w-[400px] min-w-[300px] w-full">
        {/* Logo */}
        <div className="flex justify-center items-center">
          <div className="md:block hidden">
            <SOPetLogo size={250} />
          </div>
          <div className="md:hidden block">
            <SOPetLogo size={150} />
          </div>
        </div>
        {/* Title */}
        <div className="flex justify-center items-center">
          <h1 className="sop-headline-md-medium md:sop-display-sm-medium">
            สร้างบัญชีใหม่
          </h1>
        </div>
        {/* Form */}
        <div className="space-y-4">
          <InputSOPet
            placeholder="อีเมลล์/เบอร์โทรศัพท์"
            variant="bordered"
            value={identifier}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIdentifier(e.target.value)
            }
          />
          <div className="relative md:mb-4 mb-12">
            <InputSOPet
              placeholder="เลข OTP"
              variant="bordered"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value)
              }
            />
            <div className="absolute right-0 md:-right-sop-80px md:top-0 md:bottom-0 -bottom-sop-36px flex items-center justify-center">
              <Button
                variant="secondary"
                size="fill"
                style={{ padding: "2px 8px", borderRadius: "8px" }}
                disabled={isRequestingOtp || !isValidEmailOrPhone(identifier)}
                onClick={handleRequestOtp}
              >
                ขอ OTP
              </Button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            variant="default"
            style={{ width: "100%", minHeight: "48px" }}
            disabled={isVerifying || !otpRequested || !otp.trim()}
            onClick={handleVerifyAndLogin}
          >
            {isVerifying ? "กำลังเข้าสู่ระบบ..." : "สร้างบัญชีใหม่"}
          </Button>
        </div>
        {/* Divider */}
        <div className="flex justify-center items-center gap-2">
          {/* TODO - Fix color */}
          <span className="w-full h-px bg-[#DEDEDE]"></span>
          <p className="sop-headline-sm-regular text-[#4C4C4C]">หรือ</p>
          <span className="w-full h-px bg-[#DEDEDE]"></span>
        </div>
        {/* Media Login */}
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => initiateOAuth("facebook")}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Sign up with Facebook"
          >
            <FacebookCustomIcon size={48} />
          </button>
          <button
            onClick={() => initiateOAuth("google")}
            className="flex justify-center items-center bg-sop-base-white aspect-square rounded-full overflow-clip w-sop-48px h-sop-48px border-[#EEEEEE] cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Sign up with Google"
          >
            <GoogleIcon size={28} />
          </button>
          <button
            onClick={() => initiateOAuth("line")}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Sign up with LINE"
          >
            <LineCustomIcon size={48} />
          </button>
        </div>
        {/* Link to Sign Up */}
        <div className="flex justify-center items-center gap-1">
          {/* TODO - Fix color */}
          <p className="sop-body-lg-regular text-[#888888]">
            หากคุณมีบัญชีแล้ว
          </p>
          <LocalizedClientLink href="/login" className="underline">
            <button className="sop-link-lg-regular text-sop-primary-500 cursor-pointer">
              เข้าสู่ระบบ
            </button>
          </LocalizedClientLink>
        </div>
      </div>
      {/* <Container className="border max-w-xl mx-auto mt-8 p-4">
        <h1 className="heading-md text-primary uppercase mb-8">
          Create account
        </h1>
        <form onSubmit={handleSubmit(submit)}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              label="First name"
              placeholder="Your first name"
              error={errors.firstName as FieldError}
              {...register("firstName")}
            />
            <LabeledInput
              className="md:w-1/2"
              label="Last name"
              placeholder="Your last name"
              error={errors.lastName as FieldError}
              {...register("lastName")}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              label="E-mail"
              placeholder="Your e-mail address"
              error={errors.email as FieldError}
              {...register("email")}
            />
            <LabeledInput
              className="md:w-1/2"
              label="Phone"
              placeholder="Your phone number"
              error={errors.phone as FieldError}
              {...register("phone")}
            />
          </div>
          <div>
            <LabeledInput
              className="mb-4"
              label="Password"
              placeholder="Your password"
              type="password"
              error={errors.password as FieldError}
              {...register("password")}
            />
            <PasswordValidator
              password={watch("password")}
              setError={setPasswordError}
            />
          </div>

          {error && <p className="label-md text-negative">{error}</p>}
          <Button
            className="w-full flex justify-center mt-8 uppercase"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Create account
          </Button>
        </form>
      </Container>
      <Container className="border max-w-xl mx-auto mt-8 p-4">
        <h1 className="heading-md text-primary uppercase mb-8">
          Already have an account?
        </h1>
        <p className="text-center label-md">
          <Link href="/user">
            <Button className="w-full flex justify-center mt-8 uppercase">
              Log in
            </Button>
          </Link>
        </p>
      </Container> */}
    </main>
  )
}
