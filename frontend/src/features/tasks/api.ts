import { request } from '@/shared/api/client'
import type { Task, TaskInput, TaskQueryParams, TaskStatus } from './types'

export const tasksApi = {
  list(params: TaskQueryParams): Promise<Task[]> {
    const qs = new URLSearchParams(Object.entries(params))
    return request<Task[]>(`/tasks?${qs}`)
  },
  create(input: TaskInput & { status: TaskStatus }): Promise<Task> {
    return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) })
  },
  update(id: string, input: TaskInput): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  },
  remove(id: string): Promise<void> {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' })
  },
  move(id: string, status: TaskStatus, index: number): Promise<Task> {
    return request<Task>(`/tasks/${id}/position`, {
      method: 'PATCH',
      body: JSON.stringify({ status, index }),
    })
  },
}
