import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/cn'

const control =
  'w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted/80 transition-colors hover:border-muted focus-visible:border-ring disabled:opacity-50 aria-[invalid=true]:border-danger'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-24 resize-y py-2', className)} {...props} />
}

export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, 'h-10 pr-8', className)} {...props} />
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
