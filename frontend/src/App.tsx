import { CircleAlert, Moon, Plus, RefreshCw, StickyNote, Sun } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from '@/features/board/Board'
import { FilterBar } from '@/features/filters/FilterBar'
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  toQueryParams,
  type Filters,
} from '@/features/filters/filters'
import { useDeleteTask, useMoveTask, useTasks } from '@/features/tasks/hooks'
import { STATUS_LABEL, toIsoDate } from '@/features/tasks/model'
import type { TaskCardActions } from '@/features/tasks/TaskCard'
import { TaskFormDialog, type FormTarget } from '@/features/tasks/TaskFormDialog'
import { STATUSES, type Task, type TaskStatus } from '@/features/tasks/types'
import { useDebounced, useTheme } from '@/shared/lib/hooks'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { useToast } from '@/shared/ui/toast'

/** Moving from the card menu appends to the end of the destination column. */
const END_OF_COLUMN = 1_000_000

function useToday(): string {
  const [today, setToday] = useState(() => toIsoDate(new Date()))
  useEffect(() => {
    const id = window.setInterval(() => setToday(toIsoDate(new Date())), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return today
}

export default function App() {
  const toast = useToast()
  const [theme, toggleTheme] = useTheme()
  const today = useToday()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const debouncedQ = useDebounced(filters.q, 250)
  const params = useMemo(
    () => toQueryParams({ ...filters, q: debouncedQ }, new Date(`${today}T12:00:00`)),
    [filters, debouncedQ, today],
  )
  const filtered = hasActiveFilters(filters)

  const { data: tasks, isPending, isError, isFetching, refetch } = useTasks(params)
  const deleteTask = useDeleteTask()

  const onMoveError = useCallback(
    (e: Error) => toast.error(`No se pudo mover la tarea. Se ha restaurado el orden. ${e.message}`),
    [toast],
  )
  const move = useMoveTask(onMoveError)

  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [toDelete, setToDelete] = useState<Task | null>(null)

  const actions: TaskCardActions = {
    onEdit: (task) => setFormTarget({ kind: 'edit', task }),
    onDelete: setToDelete,
    onMove: (task, status) => {
      move({ id: task.id, status, index: END_OF_COLUMN })
      toast.success(`«${task.title}» movida a ${STATUS_LABEL[status]}.`)
    },
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await deleteTask.mutateAsync(toDelete.id)
      toast.success('Tarea eliminada.')
      setToDelete(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar la tarea.')
    }
  }

  const visibleStatuses: readonly TaskStatus[] =
    filters.status === 'all' ? STATUSES : [filters.status]
  const list = tasks ?? []

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#board"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al tablero
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 -rotate-3 items-center justify-center rounded-lg bg-card-lemon text-card-foreground shadow-card">
              <StickyNote aria-hidden className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">StickyBoard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setFormTarget({ kind: 'create', status: 'todo' })}
            >
              <Plus aria-hidden className="size-4" /> <span>Nueva tarea</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {theme === 'dark' ? (
                <Sun aria-hidden className="size-4" />
              ) : (
                <Moon aria-hidden className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main id="board" className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tu espacio de trabajo</h1>
          <p className="mt-1 text-muted">
            Organiza tus ideas en notas y mueve cada una hasta completarla.
          </p>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {filtered && (
          <p className="text-sm text-muted" role="status">
            Filtros activos: la ordenación por arrastre está desactivada. Usa «Mover a» en el menú
            de cada tarea o restablece los filtros.
          </p>
        )}

        {isPending ? (
          <LoadingBoard />
        ) : isError && !tasks ? (
          <ErrorState onRetry={() => refetch()} retrying={isFetching} />
        ) : list.length === 0 && !filtered ? (
          <EmptyBoard onCreate={() => setFormTarget({ kind: 'create', status: 'todo' })} />
        ) : list.length === 0 ? (
          <NoResults onReset={() => setFilters(EMPTY_FILTERS)} />
        ) : (
          <Board
            tasks={list}
            today={today}
            visibleStatuses={visibleStatuses}
            dndEnabled={!filtered}
            filtered={filtered}
            actions={actions}
            onAdd={(status) => setFormTarget({ kind: 'create', status })}
            onMoveCommit={(id, status, index) => move({ id, status, index })}
          />
        )}
      </main>

      <TaskFormDialog target={formTarget} onClose={() => setFormTarget(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && !deleteTask.isPending && setToDelete(null)}
        title="¿Eliminar esta tarea?"
        description={`«${toDelete?.title ?? ''}» se eliminará de forma permanente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar definitivamente"
        pending={deleteTask.isPending}
        onConfirm={confirmDelete}
      />
    </MotionConfig>
  )
}

function LoadingBoard() {
  return (
    <div role="status" aria-label="Cargando tareas" className="grid gap-4 lg:grid-cols-3">
      {STATUSES.map((s) => (
        <div key={s} className="rounded-3xl border border-border bg-surface-2/70 p-3">
          <div className="mb-3 h-5 w-32 animate-pulse rounded-md bg-border" />
          <div className="flex flex-col gap-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-border/70" />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Cargando tareas…</span>
    </div>
  )
}

function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-3xl border border-danger/40 bg-danger/10 px-6 py-12 text-center"
    >
      <CircleAlert aria-hidden className="size-8 text-danger" />
      <div>
        <p className="text-lg font-bold">No se pudieron cargar las tareas</p>
        <p className="mt-1 text-sm text-muted">
          Comprueba que el servidor está en marcha e inténtalo de nuevo.
        </p>
      </div>
      <Button variant="primary" onClick={onRetry} disabled={retrying}>
        <RefreshCw aria-hidden className="size-4" /> {retrying ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </div>
  )
}

function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
      <span className="flex size-14 -rotate-6 items-center justify-center rounded-xl bg-card-lemon text-card-foreground shadow-card">
        <StickyNote aria-hidden className="size-7" />
      </span>
      <div>
        <p className="text-xl font-bold">Tu tablero está vacío</p>
        <p className="mt-1 text-muted">Crea tu primera nota para empezar a organizarte.</p>
      </div>
      <Button variant="primary" onClick={onCreate}>
        <Plus aria-hidden className="size-4" /> Crear primera tarea
      </Button>
    </div>
  )
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-lg font-bold">Sin resultados</p>
      <p className="text-sm text-muted">
        Ninguna tarea coincide con la búsqueda y los filtros actuales.
      </p>
      <Button variant="secondary" onClick={onReset}>
        Restablecer filtros
      </Button>
    </div>
  )
}
