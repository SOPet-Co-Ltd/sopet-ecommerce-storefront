type InfotagProps = {
  children: React.ReactNode
  leftIcon?: React.ReactNode
  className?: string
  classNameIcon?: string
}

export const Infotag = ({
  children,
  leftIcon,
  className = "",
  classNameIcon = "",
}: InfotagProps) => {
  return (
    <span
      className={`
        inline-flex items-center 
        ${className}
      `}
    >
      {leftIcon && (
        <span className={`flex items-center justify-center ${classNameIcon}`}>
          {leftIcon}
        </span>
      )}

      {children}
    </span>
  )
}
