"use client"
import {
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reviewSchema, ReviewFormData } from "./schema"
import { Button } from "@/components/atoms"
import { InteractiveStarRating } from "@/components/atoms/InteractiveStarRating/InteractiveStarRating"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { createReview, Order, Review } from "@/lib/data/reviews"

interface Props {
  handleClose?: () => void
  seller: Order
}

export const ReviewForm: React.FC<Props> = ({ ...props }) => {
  const methods = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      sellerId: "",
      rating: 0,
      opinion: "",
    },
  })

  return (
    <FormProvider {...methods}>
      <Form {...props} />
    </FormProvider>
  )
}

const Form: React.FC<Props> = ({ handleClose, seller }) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    watch,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useFormContext()

  const submit = async (data: FieldValues) => {
    setIsSubmitting(true)
    setError(undefined)

    try {
      const body = {
        order_id: seller.id,
        rating: data.rating,
        reference: "seller",
        reference_id: seller.seller.id,
        customer_note: data.opinion,
      }

      const response = await createReview(body)

      // if (response.error) {
      //   setError("error")
      //   setIsSubmitting(false)
      //   return
      // }

      setError(undefined)
      setIsSubmitting(false)
      handleClose && handleClose()
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่อีกครั้ง")
      setIsSubmitting(false)
    }
  }

  const lettersCount = watch("opinion")?.length
  const rating = watch("rating")

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="px-4 space-y-4">
        <div className="max-w-full grid grid-cols-1 items-top gap-4 mb-4">
          <div>
            <label id="rating-label" className="label-sm block mb-2">
              Rating
            </label>
            <InteractiveStarRating
              value={rating}
              onChange={(value) => setValue("rating", value)}
              error={!!errors.rating}
              aria-labelledby="rating-label"
              aria-required="true"
              aria-invalid={!!errors.rating}
            />
            {errors.rating?.message && (
              <p
                id="rating-error"
                className="label-sm text-negative mt-1"
                role="alert"
                aria-live="polite"
              >
                {(errors.rating as FieldError).message}
              </p>
            )}
          </div>

          <label className={cn("label-sm block relative")}>
            <p className={cn(error && "text-negative")}>Your opinion</p>
            <textarea
              id="opinion"
              className={cn(
                "w-full px-4 py-3 h-32 border rounded-xs bg-component-secondary focus:border-primary focus:outline-hidden focus:ring-0 relative",
                error && "border-negative focus:border-negative"
              )}
              placeholder="Write your opinion about this seller..."
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.opinion}
              aria-describedby={
                errors.opinion?.message ? "opinion-error" : "opinion-count"
              }
              {...register("opinion")}
            />
            <div
              id="opinion-count"
              className={cn(
                "absolute right-4 label-medium text-secondary",
                errors.opinion?.message ? "bottom-8" : "bottom-3 "
              )}
              aria-live="polite"
            >
              {`${lettersCount} / 300`}
            </div>
            {errors.opinion?.message && (
              <p
                id="opinion-error"
                className="label-sm text-negative"
                role="alert"
                aria-live="polite"
              >
                {(errors.opinion as FieldError).message}
              </p>
            )}
          </label>
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
          aria-busy={isSubmitting}
          aria-label={
            isSubmitting ? "กำลังส่งรีวิว กรุณารอสักครู่" : "ส่งรีวิว"
          }
        >
          {isSubmitting ? "กำลังส่ง..." : "SUBMIT REVIEW"}
        </Button>
      </div>
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSubmitting && "กำลังส่งรีวิว กรุณารอสักครู่"}
      </div>
    </form>
  )
}
