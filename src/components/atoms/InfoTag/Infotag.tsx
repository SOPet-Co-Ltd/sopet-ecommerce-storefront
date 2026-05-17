type InfotagProps = {
  children: React.ReactNode
  leftIcon?: React.ReactNode
  className?: string
}

export const Infotag = ({
  children,
  leftIcon,
  className = "",
}: InfotagProps) => {
  return (
    <span
      className={`
        inline-flex items-center 
        ${className}
      `}
    >
      {leftIcon && (
        <span className="flex items-center justify-center">{leftIcon}</span>
      )}

      {children}
    </span>
  )
}
