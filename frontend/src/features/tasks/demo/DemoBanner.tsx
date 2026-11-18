import { useQueryClient } from '@tanstack/react-query'
import { Code, FlaskConical, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/toast'
import { resetDemoData } from './localApi'

const REPO_URL = 'https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace'

/** Shown only in the public demo build. */
export function DemoBanner() {
  const queryClient = useQueryClient()
  const toast = useToast()

  async function reset() {
    resetDemoData()
    await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toast.success('Demo restablecida con los datos de ejemplo.')
  }

  return (
    <aside
      aria-label="Aviso de modo demo"
      className="border-b border-border bg-card-lemon text-card-foreground"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6">
        <p className="flex basis-full items-center gap-2 font-medium sm:min-w-0 sm:flex-1 sm:basis-0">
          <FlaskConical aria-hidden className="size-4 shrink-0" />
          <span>
            Modo demo: tus cambios se guardan solo en este navegador y no se envían a ningún
            servidor.
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw aria-hidden className="size-4" /> Restablecer demo
          </Button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-2"
          >
            <Code aria-hidden className="size-4" /> Ver código
          </a>
        </div>
      </div>
    </aside>
  )
}
