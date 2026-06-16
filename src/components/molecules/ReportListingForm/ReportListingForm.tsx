"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, Textarea } from "@/components/atoms"
import { SearchableSelectField } from "@/components/molecules/SearchableSelect/SearchableSelectField"
import { toSearchOption } from "@/lib/helpers/searchable-option"
import { cn } from "@/lib/utils"

const reasonOptions = [
  {
    label: "Trademark, Copyright or DMCA Violation",
    value: "Trademark, Copyright or DMCA Violation",
  },
].map((opt) => toSearchOption(opt.label, opt.value))

const formSchema = z.object({
  reason: z.string().nonempty("Please select reason"),
  comment: z.string().nonempty("Please add comment"),
})

type FormData = z.infer<typeof formSchema>

export const ReportListingForm = ({ onClose }: { onClose: () => void }) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isSubmitting },
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      comment: "",
    },
  })

  const onSubmit = (data: FormData) => {
    console.log("Form Data:", data)
  }

  return (
    <div>
      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-4 pb-5">
            <label htmlFor="report-reason" className="label-sm">
              <p className={cn(errors?.reason && "text-negative")}>Reason</p>
              <SearchableSelectField
                control={control}
                name="reason"
                placeholder="Select reason"
                options={reasonOptions}
                hideTitle
                isRequire={false}
                error={errors.reason}
                onSelect={() => clearErrors("reason")}
              />
            </label>

            <label htmlFor="report-comment" className="label-sm">
              <p className={cn("mt-5", errors?.comment && "text-negative")}>
                Comment
              </p>
              <Textarea
                id="report-comment"
                rows={5}
                {...register("comment")}
                className={cn(errors.comment && "border-negative")}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.comment}
                aria-describedby={errors.comment ? "comment-error" : undefined}
              />
              {errors?.comment && (
                <p
                  id="comment-error"
                  className="label-sm text-negative"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.comment.message}
                </p>
              )}
            </label>
          </div>

          <div className="border-t px-4 pt-5">
            <Button
              type="submit"
              className="w-full py-3 uppercase"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              aria-label={
                isSubmitting ? "กำลังส่งรายงาน กรุณารอสักครู่" : "รายงานสินค้า"
              }
            >
              {isSubmitting ? "กำลังส่ง..." : "Report Listing"}
            </Button>
          </div>

          {/* Screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isSubmitting && "กำลังส่งรายงาน กรุณารอสักครู่"}
          </div>
        </form>
      ) : (
        <div className="text-center">
          <div className="px-4 pb-5">
            <h4 className="heading-lg uppercase">Thank you!</h4>
            <p className="max-w-[466px] mx-auto mt-4 text-lg text-secondary">
              We&apos;ll check the listing to see if it violates our guidelines
              and take the necessary action to ensure a safe shopping experience
              for everyone. Thank you for helping us maintain a trusted
              community.
            </p>
          </div>

          <div className="border-t px-4 pt-5">
            <Button
              type="button"
              className="w-full py-3 uppercase"
              onClick={onClose}
              aria-label="ปิดหน้าต่างนี้"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
