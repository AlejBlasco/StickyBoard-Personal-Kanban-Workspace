import { request } from '@/shared/api/client'
import { localTasksApi } from './demo/localApi'
import type { Task, TaskInput, TaskQueryParams, TaskStatus } from './types'

export interface TasksGateway {
  list(params: TaskQueryParams): Promise<Task[]>
  create(input: TaskInput & { status: TaskStatus }): Promise<Task>
  update(id: string, input: TaskInput): Promise<Task>
  remove(id: string): Promise<void>
  move(id: string, status: TaskStatus, index: number): Promise<Task>
}

/**
 * The public demo is a static build (`vite build --mode demo`): data lives in the visitor's browser.
 * `import.meta.env.VITE_DEMO === 'true'` is written inline on purpose: in regular builds Vite folds it
 * to a constant, so the demo adapter is dropped from the bundle.
 */

const httpTasksApi: TasksGateway = {
  list(params) {
    const qs = new URLSearchParams(Object.entries(params))
    return request<Task[]>(`/tasks?${qs}`)
  },
  create(input) {
    return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) })
  },
  update(id, input) {
    return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  },
  remove(id) {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' })
  },
  move(id, status, index) {
    return request<Task>(`/tasks/${id}/position`, {
      method: 'PATCH',
      body: JSON.stringify({ status, index }),
    })
  },
}

const gateway = (): TasksGateway =>
  import.meta.env.VITE_DEMO === 'true' ? localTasksApi : httpTasksApi

export const tasksApi: TasksGateway = {
  list: (params) => gateway().list(params),
  create: (input) => gateway().create(input),
  update: (id, input) => gateway().update(id, input),
  remove: (id) => gateway().remove(id),
  move: (id, status, index) => gateway().move(id, status, index),
}
