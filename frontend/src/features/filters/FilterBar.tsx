import { RotateCcw, Search, X } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/shared/ui/button'
import { Input, NativeSelect } from '@/shared/ui/field'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/tasks/model'
import { DUE_FILTERS, PRIORITIES, STATUSES } from '@/features/tasks/types'
import { EMPTY_FILTERS, hasActiveFilters, type Filters } from './filters'

const DUE_LABEL = {
  overdue: 'Vencidas',
  today: 'Vencen hoy',
  upcoming: 'Próximos 7 días',
  none: 'Sin fecha',
} as const

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const id = useId()
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })
  const active = hasActiveFilters(filters)

  return (
    <search aria-label="Búsqueda y filtros" className="flex flex-col gap-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          id={`${id}-q`}
          type="search"
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Buscar en título y descripción…"
          aria-label="Buscar tareas"
          className="pl-9 pr-9"
        />
        {filters.q && (
          <button
            type="button"
            onClick={() => set('q', '')}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <Labeled label="Estado" htmlFor={`${id}-status`}>
          <NativeSelect
            id={`${id}-status`}
            value={filters.status}
            onChange={(e) => set('status', e.target.value as Filters['status'])}
          >
            <option value="all">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </Labeled>

        <Labeled label="Prioridad" htmlFor={`${id}-priority`}>
          <NativeSelect
            id={`${id}-priority`}
            value={filters.priority}
            onChange={(e) => set('priority', e.target.value as Filters['priority'])}
          >
            <option value="all">Todas</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </NativeSelect>
        </Labeled>

        <Labeled label="Vencimiento" htmlFor={`${id}-due`}>
          <NativeSelect
            id={`${id}-due`}
            value={filters.due}
            onChange={(e) => set('due', e.target.value as Filters['due'])}
          >
            <option value="all">Cualquiera</option>
            {DUE_FILTERS.map((d) => (
              <option key={d} value={d}>
                {DUE_LABEL[d]}
              </option>
            ))}
          </NativeSelect>
        </Labeled>

        <Labeled label="Desde" htmlFor={`${id}-from`}>
          <Input
            id={`${id}-from`}
            type="date"
            value={filters.dueFrom}
            max={filters.dueTo || undefined}
            onChange={(e) => set('dueFrom', e.target.value)}
          />
        </Labeled>

        <Labeled label="Hasta" htmlFor={`${id}-to`}>
          <Input
            id={`${id}-to`}
            type="date"
            value={filters.dueTo}
            min={filters.dueFrom || undefined}
            onChange={(e) => set('dueTo', e.target.value)}
          />
        </Labeled>

        <Button
          variant="secondary"
          onClick={() => onChange(EMPTY_FILTERS)}
          disabled={!active}
          className="col-span-2 sm:col-span-1"
        >
          <RotateCcw aria-hidden className="size-4" /> Restablecer
        </Button>
      </div>
    </search>
  )
}

function Labeled({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
