import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from './button'

const overlay = 'sb-overlay fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px]'
const panel =
  'sb-dialog fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lift'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content className={panel}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-bold tracking-tight">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted">
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Cerrar">
                <X aria-hidden className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlay} />
        <AlertDialogPrimitive.Content className={cn(panel, 'max-w-md')}>
          <AlertDialogPrimitive.Title className="text-xl font-bold tracking-tight">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                Cancelar
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button variant="danger" disabled={pending} onClick={onConfirm}>
              {pending ? 'Eliminando…' : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
