import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, TriangleAlert } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/cn'

type Kind = 'success' | 'error'
interface ToastItem {
  id: number
  kind: Kind
  message: string
}
interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const push = useCallback((kind: Kind, message: string) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, kind, message }])
    window.setTimeout(
      () => setItems((prev) => prev.filter((t) => t.id !== id)),
      kind === 'error' ? 6000 : 3500,
    )
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              className={cn(
                'pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-lift',
                t.kind === 'error' ? 'text-danger' : 'text-foreground',
              )}
            >
              {t.kind === 'error' ? (
                <TriangleAlert aria-hidden className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
