import { CloseIcon } from "@/icons"

export const Modal = ({
  children,
  heading,
  onClose,
}: {
  children: React.ReactNode
  heading: string
  onClose: () => void
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-60 px-4">
      <div
        className="bg-black/40 w-full h-full absolute backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white z-20 py-5 rounded-3xl max-w-[600px] w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="uppercase flex justify-center items-center text-2xl heading-md px-6">
          {heading}
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  )
}
