import { ApiError } from '@/shared/api/client'
import { applyMove, daysBetween, POSITION_STEP, toIsoDate } from '../model'
import { normalizeTitle } from '../validation'
import {
  COLORS,
  DESCRIPTION_MAX,
  STATUSES,
  TITLE_MAX,
  type Task,
  type TaskInput,
  type TaskQueryParams,
  type TaskStatus,
} from '../types'
import { buildSeed } from './demoSeed'

/**
 * Browser-only stand-in for the REST API, used by the public demo.
 * It mirrors the server rules (validation, normalization, ordering and filters) and keeps
 * the data in this browser's localStorage, so nothing is ever sent to a server.
 */

const STORAGE_KEY = 'stickyboard-demo-tasks-v1'

// Used when localStorage is unavailable (private mode, blocked storage)
let memory: Task[] | null = null

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Partial<Task>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.position === 'number' &&
    STATUSES.includes(t.status as TaskStatus)
  )
}

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every(isTask)) return parsed
    }
  } catch {
    if (memory) return memory
  }
  if (memory) return memory
  const seeded = buildSeed()
  save(seeded)
  return seeded
}

function save(tasks: Task[]): void {
  memory = tasks
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    /* storage unavailable: keep the in-memory copy for this session */
  }
}

/** Restores the original sample data. */
export function resetDemoData(): void {
  memory = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  save(buildSeed())
}

function validationError(errors: Record<string, string[]>): ApiError {
  return new ApiError(400, 'One or more validation errors occurred.', errors)
}

function validateInput(input: TaskInput): TaskInput {
  const errors: Record<string, string[]> = {}
  const title = normalizeTitle(input.title ?? '')
  const description = input.description?.trim() || null

  if (!title) errors.title = ['Title is required.']
  else if (title.length > TITLE_MAX)
    errors.title = [`Title must be at most ${TITLE_MAX} characters.`]
  if (description && description.length > DESCRIPTION_MAX)
    errors.description = [`Description must be at most ${DESCRIPTION_MAX} characters.`]
  if (!COLORS.includes(input.color)) errors.color = [`Color must be one of: ${COLORS.join(', ')}.`]
  if (Object.keys(errors).length > 0) throw validationError(errors)

  return { ...input, title, description }
}

/** Same semantics as the API: see docs/API.md (due filters, inclusive ranges, case-insensitive text). */
export function filterTasks(tasks: Task[], params: TaskQueryParams): Task[] {
  const q = params.q?.trim().toLowerCase()
  const today = params.today
  return tasks
    .filter((t) => {
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !(t.description ?? '').toLowerCase().includes(q)
      )
        return false
      if (params.status && t.status !== params.status) return false
      if (params.priority && t.priority !== params.priority) return false
      if (params.dueFrom && (!t.dueDate || t.dueDate < params.dueFrom)) return false
      if (params.dueTo && (!t.dueDate || t.dueDate > params.dueTo)) return false
      switch (params.due) {
        case 'overdue':
          return t.dueDate !== null && t.dueDate < today && t.status !== 'done'
        case 'today':
          return t.dueDate === today
        case 'upcoming':
          return (
            t.dueDate !== null &&
            daysBetween(today, t.dueDate) > 0 &&
            daysBetween(today, t.dueDate) <= 7
          )
        case 'none':
          return t.dueDate === null
        default:
          return true
      }
    })
    .sort((a, b) => a.position - b.position)
}

function notFound(): ApiError {
  return new ApiError(404, 'Not found')
}

export const localTasksApi = {
  async list(params: TaskQueryParams): Promise<Task[]> {
    return filterTasks(load(), { ...params, today: params.today || toIsoDate(new Date()) })
  },

  async create(input: TaskInput & { status: TaskStatus }): Promise<Task> {
    const valid = validateInput(input)
    const tasks = load()
    const column = tasks.filter((t) => t.status === input.status)
    const last = column.reduce((max, t) => Math.max(max, t.position), 0)
    const now = new Date().toISOString()
    const created: Task = {
      id: crypto.randomUUID(),
      title: valid.title,
      description: valid.description,
      status: input.status,
      priority: valid.priority,
      color: valid.color,
      dueDate: valid.dueDate,
      position: last + POSITION_STEP,
      createdAt: now,
      updatedAt: now,
    }
    save([...tasks, created])
    return created
  },

  async update(id: string, input: TaskInput): Promise<Task> {
    const valid = validateInput(input)
    const tasks = load()
    const current = tasks.find((t) => t.id === id)
    if (!current) throw notFound()
    const updated: Task = { ...current, ...valid, updatedAt: new Date().toISOString() }
    save(tasks.map((t) => (t.id === id ? updated : t)))
    return updated
  },

  async remove(id: string): Promise<void> {
    const tasks = load()
    if (!tasks.some((t) => t.id === id)) throw notFound()
    save(tasks.filter((t) => t.id !== id))
  },

  async move(id: string, status: TaskStatus, index: number): Promise<Task> {
    if (!STATUSES.includes(status)) throw validationError({ status: ['Status is required.'] })
    if (!Number.isInteger(index) || index < 0)
      throw validationError({ index: ['Index must be zero or greater.'] })
    const tasks = load()
    if (!tasks.some((t) => t.id === id)) throw notFound()

    const now = new Date().toISOString()
    const before = new Map(tasks.map((t) => [t.id, t]))
    const moved = applyMove(tasks, id, status, index).map((t) => {
      const old = before.get(t.id)
      // like the server, only touch UpdatedAt for tasks whose place actually changed
      return old && old.status === t.status && old.position === t.position
        ? old
        : { ...t, updatedAt: now }
    })
    save(moved)
    return moved.find((t) => t.id === id) as Task
  },
}
