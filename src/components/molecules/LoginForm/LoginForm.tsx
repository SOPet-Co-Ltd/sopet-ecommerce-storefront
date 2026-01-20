"use client"
import {
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"
import { Button, InputSOPet } from "@/components/atoms"
import { zodResolver } from "@hookform/resolvers/zod"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { LabeledInput } from "@/components/cells"
import { loginFormSchema, LoginFormData } from "./schema"
import { useState } from "react"
import { login } from "@/lib/data/customer"
import { useRouter } from "next/navigation"
import { Container } from "@medusajs/ui"
import { BinIcon, FacebookCustomIcon, FacebookIcon, GoogleIcon, LineCustomIcon, SOPetLogo, SunIcon } from "@/icons"

export const LoginForm = () => {
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  )
}

const Form = () => {
  const [error, setError] = useState("")
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext()
  const router = useRouter()

  const submit = async (data: FieldValues) => {
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)

    const res = await login(formData)
    if (res) {
      setError(res)
      return
    }
    setError("")
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
            เข้าสู่ระบบ
          </h1>
        </div>
        {/* Form */}
        <div className="space-y-4">
          {/* NOTE -  */}
          <InputSOPet placeholder="อีเมลล์/เบอร์โทรศัพท์" variant="bordered" />
          <div className="relative md:mb-4 mb-12">
            <InputSOPet placeholder="เลข OTP" variant="bordered" />
            <div className="absolute right-0 md:-right-sop-80px md:top-0 md:bottom-0 -bottom-sop-36px flex items-center justify-center">
              <Button variant="secondary" disabled={true} size="fill" style={{ padding: "2px 8px", borderRadius: "8px", }}>ขอ OTP</Button>
            </div>
          </div>
          <Button variant="default" style={{ width: "100%", minHeight: "48px" }}>เข้าสู่ระบบ</Button>
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
          {/* TODO - Complete sign in with facebook */}
          <FacebookCustomIcon size={48} />
          {/* TODO - Complete sign in with google */}
          {/* NOTE - Google Icon needs div because the icon is just google logo without a background */}
          <div className="flex justify-center items-center bg-sop-base-white aspect-square rounded-full overflow-clip w-sop-48px h-sop-48px border-[#EEEEEE]">
            <GoogleIcon size={28} />
          </div>
          {/* TODO - Complete sign in with line */}
          <LineCustomIcon size={48} />
        </div>
        {/* Link to Sign Up */}
        <div className="flex justify-center items-center gap-1">
          {/* TODO - Fix color */}
          <p className="sop-body-lg-regular text-[#888888]">หากยังไม่มีบัญชีผู้ใช้งาน กรุณา</p>
          <LocalizedClientLink href="/register" className="underline"  >
            <button className="sop-link-lg-regular text-sop-primary-500 cursor-pointer">
              สร้างบัญชีใหม่
            </button>
          </LocalizedClientLink>
        </div>
      </div>
      {/* <Container className="border max-w-xl mx-auto p-4">
        <h1 className="heading-md text-primary uppercase mb-8">
          Log in to your account
        </h1>
        <form onSubmit={handleSubmit(submit)}>
          <div className="space-y-4">
            <LabeledInput
              label="E-mail"
              placeholder="Your e-mail address"
              error={errors.email as FieldError}
              {...register("email")}
            />
            <LabeledInput
              label="Password"
              placeholder="Your password"
              type="password"
              error={errors.password as FieldError}
              {...register("password")}
            />
            {error && <p className="label-md text-negative">{error}</p>}
            <Button
              className="w-full flex justify-center uppercase"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Log in
            </Button>
            <p className="text-center label-md">
              Don&apos;t have an account yet?{" "}
              <LocalizedClientLink href="/user/register" className="underline">
                Sign up!
              </LocalizedClientLink>
            </p>
          </div>
        </form>
      </Container> */}
    </main>
  )
}
