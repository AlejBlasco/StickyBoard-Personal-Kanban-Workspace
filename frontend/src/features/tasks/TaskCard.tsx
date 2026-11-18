import {
  CalendarDays,
  Flag,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { dueState, formatDueDate, PRIORITY_LABEL, STATUS_LABEL, type DueState } from './model'
import { STATUSES, type Task, type TaskColor, type TaskStatus } from './types'

const COLOR_CLASS: Record<TaskColor, string> = {
  lavender: 'bg-card-lavender',
  mint: 'bg-card-mint',
  peach: 'bg-card-peach',
  sky: 'bg-card-sky',
  lemon: 'bg-card-lemon',
  rose: 'bg-card-rose',
}

const DUE_TEXT: Record<DueState, string> = {
  none: '',
  overdue: 'Vencida',
  today: 'Vence hoy',
  soon: 'Próxima',
  later: '',
  done: '',
}

export interface TaskCardActions {
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, status: TaskStatus) => void
}

interface ViewProps extends HTMLAttributes<HTMLElement> {
  task: Task
  today: string
  actions?: TaskCardActions
  handleProps?: HTMLAttributes<HTMLButtonElement>
  handleRef?: (el: HTMLButtonElement | null) => void
  dragging?: boolean
  overlay?: boolean
}

/** Presentational card; also rendered inside the DragOverlay. */
export const TaskCardView = forwardRef<HTMLElement, ViewProps>(function TaskCardView(
  { task, today, actions, handleProps, handleRef, dragging, overlay, className, ...rest },
  ref,
) {
  const due = dueState(task, today)
  const isDone = task.status === 'done'

  return (
    <article
      ref={ref}
      aria-label={task.title}
      className={cn(
        'group relative flex gap-1 rounded-2xl p-3 text-card-foreground shadow-card transition-shadow',
        COLOR_CLASS[task.color],
        dragging && 'opacity-40',
        overlay && 'rotate-[1.5deg] shadow-lift',
        className,
      )}
      {...rest}
    >
      {(handleProps || overlay) && (
        <button
          ref={handleRef}
          type="button"
          aria-label={`Arrastrar tarea: ${task.title}`}
          className="-ml-1 mt-0.5 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-card-muted hover:bg-foreground/10 active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {actions ? (
            <button
              type="button"
              onClick={() => actions.onEdit(task)}
              className={cn(
                'rounded-md text-left text-[0.95rem] font-bold leading-snug [overflow-wrap:anywhere] hover:underline',
                isDone && 'line-through decoration-2 opacity-75',
              )}
            >
              {task.title}
            </button>
          ) : (
            <h3 className="text-[0.95rem] font-bold leading-snug [overflow-wrap:anywhere]">
              {task.title}
            </h3>
          )}

          {actions && <CardMenu task={task} actions={actions} />}
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-3 text-sm text-card-muted [overflow-wrap:anywhere]">
            {task.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-card-muted">
            <Flag
              aria-hidden
              className={cn('size-3.5', task.priority === 'high' && 'fill-current')}
            />
            <span className="sr-only">Prioridad: </span>
            {PRIORITY_LABEL[task.priority]}
          </span>

          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                due === 'overdue' && 'bg-danger text-background',
                due === 'today' && 'bg-warning text-background',
                due === 'soon' && 'ring-1 ring-warning ring-inset text-card-foreground',
                (due === 'later' || due === 'done') && 'text-card-muted',
              )}
            >
              {due === 'overdue' ? (
                <TriangleAlert aria-hidden className="size-3.5" />
              ) : (
                <CalendarDays aria-hidden className="size-3.5" />
              )}
              <span className="sr-only">Fecha límite: </span>
              {formatDueDate(task.dueDate)}
              {DUE_TEXT[due] && <span aria-hidden={false}>· {DUE_TEXT[due]}</span>}
            </span>
          )}
        </div>
      </div>
    </article>
  )
})

function CardMenu({ task, actions }: { task: Task; actions: TaskCardActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mr-1 -mt-1 size-8 text-card-muted hover:bg-foreground/10 hover:text-card-foreground"
          aria-label={`Acciones de la tarea: ${task.title}`}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => actions.onEdit(task)}>
          <Pencil aria-hidden className="size-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mover a</DropdownMenuLabel>
        {STATUSES.filter((s) => s !== task.status).map((s) => (
          <DropdownMenuItem key={s} onSelect={() => actions.onMove(task, s)}>
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onSelect={() => actions.onDelete(task)}>
          <Trash2 aria-hidden className="size-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
