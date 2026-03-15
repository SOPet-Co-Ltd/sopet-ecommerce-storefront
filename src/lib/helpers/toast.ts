import { toast as sonnerToast } from "sonner"

const sopToastBase =
  "rounded-sop-12px border font-sans shadow-[0_4px_24px_var(--color-sop-neutral-grayalpha-100)]"

export const toast = {
  info: ({ description, title }: { description?: string; title: string }) => {
    sonnerToast.info(title, {
      className: `${sopToastBase} border-sop-additionalblue-200 bg-sop-additionalblue-100 text-sop-additionalblue-700`,
      description,
    })
  },
  success: ({
    description,
    title,
  }: {
    description?: string
    title: string
  }) => {
    sonnerToast.success(title, {
      className: `${sopToastBase} border-sop-system-success-300 bg-sop-system-success-100 text-sop-system-success-500`,
      description,
    })
  },
  error: ({ description, title }: { description?: string; title: string }) => {
    sonnerToast.error(title, {
      className: `${sopToastBase} border-sop-system-error-200 bg-sop-system-error-100 text-sop-system-error-500`,
      description,
    })
  },
}
