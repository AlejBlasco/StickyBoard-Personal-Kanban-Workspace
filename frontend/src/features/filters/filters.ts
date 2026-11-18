import { toIsoDate } from '@/features/tasks/model'
import type { DueFilter, TaskPriority, TaskQueryParams, TaskStatus } from '@/features/tasks/types'

export interface Filters {
  q: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  due: DueFilter | 'all'
  dueFrom: string
  dueTo: string
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  status: 'all',
  priority: 'all',
  due: 'all',
  dueFrom: '',
  dueTo: '',
}

export function hasActiveFilters(f: Filters): boolean {
  return (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).some((k) => f[k] !== EMPTY_FILTERS[k])
}

export function toQueryParams(f: Filters, now = new Date()): TaskQueryParams {
  const params: TaskQueryParams = { today: toIsoDate(now) }
  const q = f.q.trim()
  if (q) params.q = q
  if (f.status !== 'all') params.status = f.status
  if (f.priority !== 'all') params.priority = f.priority
  if (f.due !== 'all') params.due = f.due
  if (f.dueFrom) params.dueFrom = f.dueFrom
  if (f.dueTo) params.dueTo = f.dueTo
  return params
}
