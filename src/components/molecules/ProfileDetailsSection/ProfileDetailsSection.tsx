"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { FieldError, useForm } from "react-hook-form"
import { z } from "zod"
import { Avatar, Button, InputSOPet } from "@/components/atoms"
import { SearchableSelectField } from "@/components/molecules/SearchableSelect/SearchableSelectField"
import { toSearchOption } from "@/lib/helpers/searchable-option"
import { updateProfile, uploadAvatar } from "@/lib/data/customer"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { formatThaiPhoneNumberForDisplay } from "@/lib/helpers/phone"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ProfileDetailsSectionProps = {
  user: HttpTypes.StoreCustomer
}

const userProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    birthDay: z.string().optional(),
    birthMonth: z.string().optional(),
    birthYear: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { birthDay, birthMonth, birthYear } = data
    const filledCount = [birthDay, birthMonth, birthYear].filter(Boolean).length

    if (filledCount > 0 && filledCount < 3) {
      if (!birthDay)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "",
          path: ["birthDay"],
        })
      if (!birthMonth)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "",
          path: ["birthMonth"],
        })
      if (!birthYear)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "",
          path: ["birthYear"],
        })
    }
  })

type UserProfileFormData = z.infer<typeof userProfileSchema>

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 100 },
  (_, i) => CURRENT_YEAR - i
)

const BIRTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) =>
  toSearchOption(String(index + 1))
)

const BIRTH_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  toSearchOption(String(index + 1))
)

const BIRTH_YEAR_SEARCH_OPTIONS = BIRTH_YEAR_OPTIONS.map((year) =>
  toSearchOption(String(year), String(year))
)

function parseBirthDateParts(birthDate: string | undefined) {
  if (!birthDate?.trim()) {
    return { day: "", month: "", year: "" }
  }

  const [datePart] = birthDate.split("T")
  const [year, month, day] = datePart.split("-")

  if (!year || !month || !day) {
    return { day: "", month: "", year: "" }
  }

  return {
    day: String(Number(day)),
    month: String(Number(month)),
    year,
  }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const router = useRouter()
  const metadata = (user as { metadata?: Record<string, unknown> }).metadata
  const birthDate = metadata?.birth_date as string | undefined
  const birthDateParts = parseBirthDateParts(birthDate)
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email ||
    formatThaiPhoneNumberForDisplay(user.phone) ||
    ""

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    metadata?.avatar_url as string | undefined
  )
  const [avatarBlurhash, setAvatarBlurhash] = useState<string | undefined>(
    metadata?.avatar_blurhash as string | undefined
  )
  const [profileError, setProfileError] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: displayName,
      birthDay: birthDateParts.day,
      birthMonth: birthDateParts.month,
      birthYear: birthDateParts.year,
    },
  })

  const onSubmit = async (data: UserProfileFormData) => {
    setProfileError(null)
    const { name, birthDay, birthMonth, birthYear } = data
    let birth_date: string | undefined
    if (birthDay && birthMonth && birthYear) {
      const d = String(birthDay).padStart(2, "0")
      const m = String(birthMonth).padStart(2, "0")
      birth_date = `${birthYear}-${m}-${d}`
    }
    const result = await updateProfile({ name, birth_date })
    if (result.success) {
      router.refresh()
    } else {
      setProfileError(result.error)
    }
  }

  const onAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    // uploadAvatar is a Server Action: its logs appear in the terminal (yarn dev), not the browser console
    console.log("[onAvatarChange] Calling uploadAvatar", {
      filename: file.name,
      size: file.size,
    })
    const result = await uploadAvatar(file)
    console.log("[onAvatarChange] uploadAvatar returned", {
      success: result.success,
      error: !result.success ? result.error : undefined,
    })
    setAvatarLoading(false)
    e.target.value = ""
    if (result.success) {
      setAvatarUrl(result.avatar_url)
      if (result.avatar_blurhash !== undefined) {
        setAvatarBlurhash(result.avatar_blurhash)
      }
      router.refresh()
    }
  }

  const currentAvatarUrl =
    avatarUrl ?? (metadata?.avatar_url as string | undefined)

  const birthErrorWithoutMessage =
    errors.birthDay || errors.birthMonth || errors.birthYear
      ? ({ type: "custom", message: "" } as FieldError)
      : undefined

  return (
    <div className="flex flex-col gap-sop-24px items-center min-h-[500px]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={onAvatarChange}
      />
      {/* Profile image */}
      <div className="flex flex-col gap-sop-16px justify-center items-center">
        <Avatar
          src={currentAvatarUrl}
          size="large"
          className="rounded-full border border-sop-neutral-grayalpha-300"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          rounded="rounded"
          fill={true}
          onClick={onAvatarClick}
          disabled={avatarLoading}
        >
          {avatarLoading ? "กำลังอัปโหลด..." : "เลือกรูปภาพ"}
        </Button>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-[90px_1fr] md:grid-cols-[140px_1fr] gap-x-4 gap-y-4 w-full items-center mt-4"
      >
        <label
          htmlFor="name"
          className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200"
        >
          ชื่อ-นามสกุล
        </label>
        <div>
          <InputSOPet
            size="sm"
            type="text"
            id="name"
            {...register("name")}
            className="lg:w-[254px]"
            variant="bordered"
            placeholder="ชื่อ-นามสกุล"
          />
        </div>

        <p className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200">
          อีเมลล์
        </p>
        <div className="flex gap-2 items-center w-full">
          {user.email ? (
            <>
              <div className="w-full max-w-[254px]">
                <InputSOPet
                  size="sm"
                  type="text"
                  value={user.email}
                  disabled
                  variant="bordered"
                />
              </div>
              <LocalizedClientLink href="/user/profile/email/change">
                <Button type="button" variant="secondary" rounded="rounded">
                  เปลี่ยน
                </Button>
              </LocalizedClientLink>
            </>
          ) : (
            <LocalizedClientLink href="/user/profile/email/add">
              <Button type="button" variant="secondary" rounded="rounded">
                เพิ่ม
              </Button>
            </LocalizedClientLink>
          )}
        </div>

        <p className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200">
          เบอร์โทรศัพท์
        </p>
        <div className="flex gap-2 items-center w-full">
          {user.phone ? (
            <>
              <div className="w-full max-w-[254px]">
                <InputSOPet
                  size="sm"
                  type="text"
                  value={formatThaiPhoneNumberForDisplay(user.phone)}
                  disabled
                  variant="bordered"
                />
              </div>
              <LocalizedClientLink href="/user/profile/phone/change">
                <Button type="button" variant="secondary" rounded="rounded">
                  เปลี่ยน
                </Button>
              </LocalizedClientLink>
            </>
          ) : (
            <LocalizedClientLink href="/user/profile/phone/add">
              <Button type="button" variant="secondary" rounded="rounded">
                เพิ่ม
              </Button>
            </LocalizedClientLink>
          )}
        </div>

        <label className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200">
          วันเกิด
        </label>
        <div>
          <div className="flex gap-2">
            <SearchableSelectField
              control={control}
              name="birthDay"
              placeholder="วัน"
              options={BIRTH_DAY_OPTIONS}
              hideTitle
              isRequire={false}
              className="max-w-[150px]"
              showAllOptions
              dropdownAlign="start"
              error={birthErrorWithoutMessage}
            />
            <SearchableSelectField
              control={control}
              name="birthMonth"
              placeholder="เดือน"
              options={BIRTH_MONTH_OPTIONS}
              hideTitle
              isRequire={false}
              className="max-w-[150px]"
              showAllOptions
              dropdownAlign="start"
              error={birthErrorWithoutMessage}
            />
            <SearchableSelectField
              control={control}
              name="birthYear"
              placeholder="ปี"
              options={BIRTH_YEAR_SEARCH_OPTIONS}
              hideTitle
              isRequire={false}
              className="max-w-[150px]"
              showAllOptions
              dropdownAlign="start"
              error={birthErrorWithoutMessage}
            />
          </div>
          {(errors.birthDay || errors.birthMonth || errors.birthYear) && (
            <p className="text-sop-system-error-400 sop-body-sm-regular mt-1">
              กรุณากรอกวันเกิดให้ครบถ้วน
            </p>
          )}
        </div>

        {profileError && (
          <p className="col-span-2 text-sop-system-error-400 sop-body-sm-regular">
            {profileError}
          </p>
        )}

        <div className="flex justify-center items-center w-full col-span-2 mt-sop-24px">
          <Button
            type="submit"
            variant="primary"
            size="xl"
            rounded="rounded"
            disabled={isSubmitting}
          >
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  )
}
