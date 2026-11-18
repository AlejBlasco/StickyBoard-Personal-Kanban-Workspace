import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/shared/lib/cn'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuLabel = ({
  className,
  ...p
}: ComponentPropsWithoutRef<typeof Menu.Label>) => (
  <Menu.Label
    className={cn(
      'px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted',
      className,
    )}
    {...p}
  />
)
export const DropdownMenuSeparator = () => <Menu.Separator className="my-1 h-px bg-border" />

export function DropdownMenuContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align="end"
        sideOffset={6}
        className={cn(
          'z-50 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-lift',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

export function DropdownMenuItem({
  className,
  danger,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Item> & { danger?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50',
        danger && 'text-danger',
        className,
      )}
      {...props}
    />
  )
}
