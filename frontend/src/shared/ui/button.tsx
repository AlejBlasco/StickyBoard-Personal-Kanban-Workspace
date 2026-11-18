import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const button = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-card hover:brightness-110',
        secondary: 'border border-border bg-surface text-foreground hover:bg-surface-2',
        ghost: 'text-muted hover:bg-surface-2 hover:text-foreground',
        danger: 'bg-danger text-background hover:brightness-110',
      },
      size: {
        md: 'h-10 px-4 text-sm',
        sm: 'h-9 px-3 text-sm',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />
}
