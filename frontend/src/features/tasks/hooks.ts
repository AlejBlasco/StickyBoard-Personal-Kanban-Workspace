import { useCallback } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from './api'
import { applyMove } from './model'
import type { Task, TaskInput, TaskQueryParams, TaskStatus } from './types'

const KEY = ['tasks'] as const

export function useTasks(params: TaskQueryParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => tasksApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInput & { status: TaskStatus }) => tasksApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => tasksApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export interface MoveVars {
  id: string
  status: TaskStatus
  index: number
}

/**
 * Optimistic move: the cache is updated synchronously (no flicker after a drop) and rolled back
 * if the API fails. The server stays the authority on order; we refetch when it settles.
 */
export function useMoveTask(onError?: (error: Error) => void) {
  const qc = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: ({ id, status, index }: MoveVars) => tasksApi.move(id, status, index),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return useCallback(
    (vars: MoveVars) => {
      void qc.cancelQueries({ queryKey: KEY })
      const snapshots = qc.getQueriesData<Task[]>({ queryKey: KEY })
      for (const [key, data] of snapshots) {
        if (data) qc.setQueryData<Task[]>(key, applyMove(data, vars.id, vars.status, vars.index))
      }
      mutateAsync(vars).catch((error: Error) => {
        for (const [key, data] of snapshots) qc.setQueryData(key, data)
        onError?.(error)
      })
    },
    [qc, mutateAsync, onError],
  )
}
