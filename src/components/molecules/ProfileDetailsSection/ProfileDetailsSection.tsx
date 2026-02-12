"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  InputSOPet,
} from "@/components/atoms"
import { DownArrowIcon } from "@/icons"
import { updateProfile, uploadAvatar } from "@/lib/data/customer"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ProfileDetailsSectionProps = {
  user: HttpTypes.StoreCustomer
}

const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const router = useRouter()
  const metadata = (user as { metadata?: Record<string, unknown> }).metadata
  const birthDate = metadata?.birth_date as string | undefined
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email ||
    user.phone ||
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
    formState: { isSubmitting },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: displayName,
      birthDay: birthDate ? new Date(birthDate).getDate().toString() : "",
      birthMonth: birthDate
        ? (new Date(birthDate).getMonth() + 1).toString()
        : "",
      birthYear: birthDate ? new Date(birthDate).getFullYear().toString() : "",
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
                  value={user.phone}
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
        <div className="flex gap-2">
          <Controller
            name="birthDay"
            control={control}
            render={({ field }) => (
              <Dropdown
                button={{ variant: "neutral", size: "lg", fill: true }}
                triggerClassName="max-w-[150px]"
                placeholder="วัน"
                value={field.value}
                onValueChange={field.onChange}
                icon={<DownArrowIcon size={10} color="#454547" />}
              >
                {Array.from({ length: 31 }, (_, index) => (
                  <DropdownItem key={index} value={String(index + 1)}>
                    {String(index + 1)}
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          />
          <Controller
            name="birthMonth"
            control={control}
            render={({ field }) => (
              <Dropdown
                button={{ variant: "neutral", size: "lg", fill: true }}
                triggerClassName="max-w-[150px]"
                placeholder="เดือน"
                value={field.value}
                onValueChange={field.onChange}
                icon={<DownArrowIcon size={10} color="#454547" />}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <DropdownItem key={index} value={String(index + 1)}>
                    {String(index + 1)}
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          />
          <Controller
            name="birthYear"
            control={control}
            render={({ field }) => (
              <Dropdown
                button={{ variant: "neutral", size: "lg", fill: true }}
                triggerClassName="max-w-[150px]"
                placeholder="ปี"
                value={field.value}
                onValueChange={field.onChange}
                icon={<DownArrowIcon size={10} color="#454547" />}
              >
                {BIRTH_YEAR_OPTIONS.map((year) => (
                  <DropdownItem key={year} value={String(year)}>
                    {year}
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          />
        </div>

        {profileError && (
          <p className="col-span-2 text-red-500 sop-body-sm-regular">
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
