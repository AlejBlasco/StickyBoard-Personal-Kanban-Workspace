export const STATUSES = ['todo', 'inProgress', 'done'] as const
export type TaskStatus = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type TaskPriority = (typeof PRIORITIES)[number]

export const COLORS = ['lavender', 'mint', 'peach', 'sky', 'lemon', 'rose'] as const
export type TaskColor = (typeof COLORS)[number]

export const DUE_FILTERS = ['overdue', 'today', 'upcoming', 'none'] as const
export type DueFilter = (typeof DUE_FILTERS)[number]

export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 2000

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  color: TaskColor
  dueDate: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description: string | null
  priority: TaskPriority
  color: TaskColor
  dueDate: string | null
}

export interface TaskQueryParams {
  q?: string
  status?: TaskStatus
  priority?: TaskPriority
  due?: DueFilter
  dueFrom?: string
  dueTo?: string
  today: string
}
