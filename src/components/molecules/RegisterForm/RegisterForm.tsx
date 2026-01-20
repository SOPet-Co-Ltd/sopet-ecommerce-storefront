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
import { LabeledInput } from "@/components/cells"
import { registerFormSchema, RegisterFormData } from "./schema"
import { signup } from "@/lib/data/customer"
import { useState } from "react"
import { Container } from "@medusajs/ui"
import Link from "next/link"
import { PasswordValidator } from "@/components/cells/PasswordValidator/PasswordValidator"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { FacebookCustomIcon, GoogleIcon, LineCustomIcon, SOPetLogo } from "@/icons"

export const RegisterForm = () => {
  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
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
  const [passwordError, setPasswordError] = useState({
    isValid: false,
    lower: false,
    upper: false,
    "8chars": false,
    symbolOrDigit: false,
  })
  const [error, setError] = useState()
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext()

  const submit = async (data: FieldValues) => {
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("first_name", data.firstName)
    formData.append("last_name", data.lastName)
    formData.append("phone", data.phone)

    const res = passwordError.isValid && (await signup(formData))

    if (res && !res?.id) setError(res)
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
          <p className="sop-body-lg-regular text-[#888888]">หากคุณมีบัญชีแล้ว</p>
          <LocalizedClientLink href="/login" className="underline"  >
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
