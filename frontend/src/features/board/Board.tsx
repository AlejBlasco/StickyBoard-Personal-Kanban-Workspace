import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  findColumn,
  groupByStatus,
  moveAcross,
  reorderWithin,
  STATUS_LABEL,
  toColumns,
  type Columns,
} from '@/features/tasks/model'
import { TaskCardView, type TaskCardActions } from '@/features/tasks/TaskCard'
import { STATUSES, type Task, type TaskStatus } from '@/features/tasks/types'
import { Column } from './Column'

interface BoardProps {
  tasks: Task[]
  today: string
  visibleStatuses: readonly TaskStatus[]
  /** Reordering is only meaningful on the full, unfiltered columns. */
  dndEnabled: boolean
  filtered: boolean
  actions: TaskCardActions
  onAdd: (status: TaskStatus) => void
  onMoveCommit: (id: string, status: TaskStatus, index: number) => void
}

export function Board({
  tasks,
  today,
  visibleStatuses,
  dndEnabled,
  filtered,
  actions,
  onAdd,
  onMoveCommit,
}: BoardProps) {
  const base = useMemo(() => toColumns(tasks), [tasks])
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const [drag, setDrag] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  // `dragRef` always holds the latest layout, because dragOver events can arrive faster than renders.
  // Announcements may fire after the drag state is reset, so they read `liveColumns` instead.
  const dragRef = useRef<Columns | null>(null)
  const liveColumns = useRef<Columns>(base)

  const setLayout = (next: Columns | null) => {
    dragRef.current = next
    if (next) liveColumns.current = next
    setDrag(next)
  }

  const grouped = useMemo(() => {
    const fromTasks = groupByStatus(tasks)
    if (!drag) return fromTasks
    const result = { todo: [], inProgress: [], done: [] } as Record<TaskStatus, Task[]>
    for (const s of STATUSES) {
      result[s] = drag[s].map((id) => byId.get(id)).filter((t): t is Task => !!t)
    }
    return result
  }, [tasks, drag, byId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const reset = () => {
    setLayout(null)
    setActiveId(null)
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
    setLayout(base)
  }

  function onDragOver(e: DragOverEvent) {
    if (!e.over) return
    setLayout(moveAcross(dragRef.current ?? base, String(e.active.id), String(e.over.id)))
  }

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id)
    if (!e.over) return reset()

    const next = reorderWithin(dragRef.current ?? base, id, String(e.over.id))
    liveColumns.current = next
    const status = findColumn(next, id)
    const original = byId.get(id)
    if (status && original) {
      const index = next[status].indexOf(id)
      const unchanged = original.status === status && base[status].indexOf(id) === index
      if (!unchanged) onMoveCommit(id, status, index)
    }
    reset()
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Has cogido «${byId.get(String(active.id))?.title ?? 'la tarea'}».`,
    onDragOver: ({ active, over }) => {
      if (!over) return undefined
      const status = findColumn(liveColumns.current, String(over.id))
      return status
        ? `«${byId.get(String(active.id))?.title}» sobre ${STATUS_LABEL[status]}.`
        : undefined
    },
    onDragEnd: ({ active, over }) => {
      const title = byId.get(String(active.id))?.title
      const status = over ? findColumn(liveColumns.current, String(over.id)) : undefined
      return status
        ? `«${title}» soltada en ${STATUS_LABEL[status]}.`
        : `«${title}» devuelta a su sitio.`
    },
    onDragCancel: ({ active }) =>
      `Movimiento cancelado. «${byId.get(String(active.id))?.title}» sin cambios.`,
  }

  const activeTask = activeId ? byId.get(activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Para mover la tarea, pulsa Espacio, usa las flechas para elegir posición o columna y pulsa Espacio de nuevo para soltar. Escape cancela.',
        },
      }}
    >
      <div
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:snap-none lg:overflow-visible',
          visibleStatuses.length === 1 ? 'lg:max-w-xl lg:grid-cols-1' : 'lg:grid-cols-3',
        )}
      >
        {visibleStatuses.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={grouped[status]}
            today={today}
            actions={actions}
            dndEnabled={dndEnabled}
            filtered={filtered}
            onAdd={onAdd}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 160 }}>
        {activeTask ? <TaskCardView task={activeTask} today={today} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
