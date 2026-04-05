import { toast as sonnerToast } from "sonner"

const sopToastBase =
  "rounded-sop-12px border font-sans shadow-[0_4px_24px_var(--color-sop-neutral-grayalpha-100)]"

export type SopToastPayload = {
  title: string
  description?: string
  /** Sonner built-in dismiss (X). Default true. */
  closeButton?: boolean
  /** ms; Sonner default applies when omitted */
  duration?: number
}

export const toast = {
  /** Dismiss one toast by id (returned from success/error/info), or all if id omitted */
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },

  info: ({
    closeButton = true,
    description,
    duration,
    title,
  }: SopToastPayload): string | number => {
    return sonnerToast.info(title, {
      className: `${sopToastBase} border-sop-additionalblue-200 bg-sop-additionalblue-100 text-sop-additionalblue-700`,
      closeButton,
      description,
      duration,
    })
  },

  success: ({
    closeButton = true,
    description,
    duration,
    title,
  }: SopToastPayload): string | number => {
    return sonnerToast.success(title, {
      className: `${sopToastBase} border-sop-system-success-300 bg-sop-system-success-100 text-sop-system-success-500`,
      closeButton,
      description,
      duration,
    })
  },

  error: ({
    closeButton = true,
    description,
    duration,
    title,
  }: SopToastPayload): string | number => {
    return sonnerToast.error(title, {
      className: `${sopToastBase} border-sop-system-error-200 bg-sop-system-error-100 text-sop-system-error-500`,
      closeButton,
      description,
      duration,
    })
  },
}
