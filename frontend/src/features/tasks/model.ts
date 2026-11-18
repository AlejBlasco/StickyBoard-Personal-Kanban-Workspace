import { STATUSES, type Task, type TaskStatus } from './types'

export const POSITION_STEP = 1024

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Pendiente',
  inProgress: 'En progreso',
  done: 'Completado',
}

export const PRIORITY_LABEL = { low: 'Baja', medium: 'Media', high: 'Alta' } as const

export type Columns = Record<TaskStatus, string[]>

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], inProgress: [], done: [] }
  for (const t of tasks) groups[t.status].push(t)
  for (const s of STATUSES) groups[s].sort((a, b) => a.position - b.position)
  return groups
}

export function toColumns(tasks: Task[]): Columns {
  const g = groupByStatus(tasks)
  return {
    todo: g.todo.map((t) => t.id),
    inProgress: g.inProgress.map((t) => t.id),
    done: g.done.map((t) => t.id),
  }
}

/** Mirrors the server: remove, insert at index (clamped), renumber the column. */
export function applyMove(tasks: Task[], id: string, status: TaskStatus, index: number): Task[] {
  const moving = tasks.find((t) => t.id === id)
  if (!moving) return tasks
  const column = groupByStatus(tasks.filter((t) => t.id !== id))[status]
  column.splice(Math.max(0, Math.min(index, column.length)), 0, { ...moving, status })
  const renumbered = new Map(
    column.map((t, i) => [t.id, { ...t, position: (i + 1) * POSITION_STEP }]),
  )
  return tasks.map((t) => renumbered.get(t.id) ?? t)
}

// ---- dates: DueDate is a calendar date, never an instant ----

export function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function daysBetween(fromIso: string, toIsoStr: string): number {
  const ms = parseIsoDate(toIsoStr).getTime() - parseIsoDate(fromIso).getTime()
  return Math.round(ms / 86_400_000)
}

export type DueState = 'none' | 'overdue' | 'today' | 'soon' | 'later' | 'done'

/** `soon` = within the next 3 days. Completed tasks are never overdue. */
export function dueState(task: Pick<Task, 'dueDate' | 'status'>, today: string): DueState {
  if (!task.dueDate) return 'none'
  if (task.status === 'done') return 'done'
  const diff = daysBetween(today, task.dueDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon'
  return 'later'
}

/** Includes the year only when it differs from the current one. */
export function formatDueDate(iso: string, now = new Date()): string {
  const date = parseIsoDate(iso)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  }).format(date)
}

// ---- drag & drop on column id lists ----

export const columnDropId = (s: TaskStatus) => `column:${s}`
export const isColumnDropId = (id: string) => id.startsWith('column:')
const statusFromDropId = (id: string) => id.slice('column:'.length) as TaskStatus

export function findColumn(columns: Columns, id: string): TaskStatus | undefined {
  if (isColumnDropId(id)) return statusFromDropId(id)
  return STATUSES.find((s) => columns[s].includes(id))
}

/** While dragging over another column: move the active id into it (at the over item, or the end). */
export function moveAcross(columns: Columns, activeId: string, overId: string): Columns {
  const from = findColumn(columns, activeId)
  const to = findColumn(columns, overId)
  if (!from || !to || from === to) return columns
  const target = columns[to].slice()
  const overIndex = isColumnDropId(overId) ? -1 : target.indexOf(overId)
  target.splice(overIndex >= 0 ? overIndex : target.length, 0, activeId)
  return { ...columns, [from]: columns[from].filter((i) => i !== activeId), [to]: target }
}

/** On drop: reorder inside the column when over an item of the same column. */
export function reorderWithin(columns: Columns, activeId: string, overId: string): Columns {
  const col = findColumn(columns, activeId)
  if (!col || col !== findColumn(columns, overId) || isColumnDropId(overId)) return columns
  const list = columns[col].slice()
  const from = list.indexOf(activeId)
  const to = list.indexOf(overId)
  if (from === to) return columns
  list.splice(from, 1)
  list.splice(to, 0, activeId)
  return { ...columns, [col]: list }
}
