"use client"
import {
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileDetailsSchema, ProfileDetailsFormData } from "./schema"
import { LabeledInput } from "@/components/cells"
import { Button } from "@/components/atoms"
import { updateCustomer } from "@/lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import { useSubmitOnce } from "@/lib/hooks/use-submit-once"

interface Props {
  defaultValues?: ProfileDetailsFormData
  handleClose?: () => void
}

export const ProfileDetailsForm: React.FC<Props> = ({
  defaultValues,
  ...props
}) => {
  const methods = useForm<ProfileDetailsFormData>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
  })

  return (
    <FormProvider {...methods}>
      <Form {...props} />
    </FormProvider>
  )
}

const Form: React.FC<Props> = ({ handleClose }) => {
  const [error, setError] = useState<string>()
  const {
    handleSubmit,
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext()
  const phone = useWatch({ control, name: "phone" })
  const { isSubmitting, runSubmit } = useSubmitOnce()

  const submit = async (data: FieldValues) => {
    await runSubmit(async () => {
      const body = {
        first_name: data.firstName,
        last_name: data.lastName,
      }
      try {
        await updateCustomer(body as HttpTypes.StoreUpdateCustomer)
      } catch (err) {
        setError((err as Error).message)
        return
      }

      setError("")
      handleClose && handleClose()
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="px-4 space-y-4">
        <div className="max-w-full grid grid-cols-2 items-top gap-4 mb-4">
          <LabeledInput
            label="First name"
            placeholder="Type first name"
            error={errors.firstName as FieldError}
            aria-required="true"
            {...register("firstName")}
          />
          <LabeledInput
            label="Last name"
            placeholder="Type last name"
            error={errors.lastName as FieldError}
            aria-required="true"
            {...register("lastName")}
          />
          <ThaiPhoneInput
            title="Phone"
            placeholder="Type phone number"
            state="default"
            value={phone}
            disabled
            aria-disabled="true"
            onValueChange={() => {}}
            aria-required="true"
          />
          <LabeledInput
            label="Email"
            disabled
            aria-disabled="true"
            {...register("email")}
          />
        </div>
        {error && (
          <p className="label-md text-negative" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          loading={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "กำลังบันทึก..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
