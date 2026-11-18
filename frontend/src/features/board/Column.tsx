import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, CircleDashed, Loader, Plus, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { columnDropId, STATUS_LABEL } from '@/features/tasks/model'
import { TaskCardView, type TaskCardActions } from '@/features/tasks/TaskCard'
import type { Task, TaskStatus } from '@/features/tasks/types'

const ICON: Record<TaskStatus, LucideIcon> = {
  todo: CircleDashed,
  inProgress: Loader,
  done: CheckCircle2,
}

const EMPTY_TEXT: Record<TaskStatus, string> = {
  todo: 'Nada pendiente. Añade una tarea o arrastra una aquí.',
  inProgress: 'Arrastra aquí lo que estés haciendo ahora.',
  done: 'Las tareas completadas se quedan aquí hasta que las elimines o las recuperes.',
}

interface ColumnProps {
  status: TaskStatus
  tasks: Task[]
  today: string
  actions: TaskCardActions
  dndEnabled: boolean
  filtered: boolean
  onAdd: (status: TaskStatus) => void
}

export function Column({
  status,
  tasks,
  today,
  actions,
  dndEnabled,
  filtered,
  onAdd,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status), disabled: !dndEnabled })
  const Icon = ICON[status]
  const headingId = `col-${status}`

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex min-h-48 min-w-[85%] snap-center flex-col rounded-3xl border border-border bg-surface-2/70 p-3 transition-colors sm:min-w-[46%] lg:min-w-0',
        isOver && 'border-primary bg-surface-2 ring-2 ring-primary/40',
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
        >
          <Icon aria-hidden className={cn('size-4', status === 'done' && 'text-success')} />
          {STATUS_LABEL[status]}
          <span
            className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted"
            aria-label={`${tasks.length} tareas`}
          >
            {tasks.length}
          </span>
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onAdd(status)}
          aria-label={`Añadir tarea a ${STATUS_LABEL[status]}`}
        >
          <Plus aria-hidden className="size-4" />
        </Button>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className="flex flex-1 flex-col gap-2.5 pb-1"
          aria-label={`Tareas: ${STATUS_LABEL[status]}`}
        >
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              today={today}
              actions={actions}
              dndEnabled={dndEnabled}
            />
          ))}
          {tasks.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {filtered ? 'Sin tareas con estos filtros.' : EMPTY_TEXT[status]}
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  )
}

function SortableTask({
  task,
  today,
  actions,
  dndEnabled,
}: {
  task: Task
  today: string
  actions: TaskCardActions
  dndEnabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !dndEnabled })

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="list-none"
    >
      <TaskCardView
        task={task}
        today={today}
        actions={actions}
        dragging={isDragging}
        handleRef={setActivatorNodeRef}
        handleProps={dndEnabled ? { ...attributes, ...listeners } : undefined}
      />
    </motion.li>
  )
}
