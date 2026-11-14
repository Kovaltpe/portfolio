import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonStyles = cva(
  'button inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'button-primary',
        secondary: 'button-secondary',
        ghost: 'button-ghost',
        outline: 'button-outline',
      },
      size: {
        default: 'button-default',
        sm: 'button-sm',
        icon: 'button-icon',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    asChild?: boolean
  }

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      className={cn(buttonStyles({ size, variant }), className)}
      {...props}
    />
  )
}
