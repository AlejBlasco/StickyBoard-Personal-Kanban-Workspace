import { vi } from 'vitest'
import type { Task } from '@/features/tasks/types'

type Body = Partial<Task> & { index?: number }

interface Options {
  failMove?: boolean
  failList?: boolean
}

/** In-memory stand-in for the REST API, mirroring the ordering rules of the real server. */
export function installFakeApi(initial: Task[] = [], opts: Options = {}) {
  let tasks = [...initial]
  const calls: { method: string; url: string; body?: Body }[] = []

  const json = (status: number, body: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    const body = init?.body ? (JSON.parse(String(init.body)) as Body) : undefined
    calls.push({ method, url: url.pathname + url.search, body })
    const path = url.pathname.replace('/api/v1', '')

    if (method === 'GET' && path === '/tasks') {
      if (opts.failList) return json(500, { title: 'boom' })
      const q = url.searchParams.get('q')?.toLowerCase()
      const priority = url.searchParams.get('priority')
      const status = url.searchParams.get('status')
      return json(
        200,
        tasks.filter(
          (t) =>
            (!q ||
              t.title.toLowerCase().includes(q) ||
              (t.description ?? '').toLowerCase().includes(q)) &&
            (!priority || t.priority === priority) &&
            (!status || t.status === status),
        ),
      )
    }

    if (method === 'POST' && path === '/tasks' && body) {
      const status = body.status ?? 'todo'
      const created: Task = {
        id: crypto.randomUUID(),
        title: body.title ?? '',
        description: body.description ?? null,
        status,
        priority: body.priority ?? 'medium',
        color: body.color ?? 'lavender',
        dueDate: body.dueDate ?? null,
        position: (tasks.filter((x) => x.status === status).length + 1) * 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      tasks.push(created)
      return json(201, created)
    }

    const id = path.split('/')[2]
    if (method === 'DELETE') {
      tasks = tasks.filter((t) => t.id !== id)
      return json(204, undefined)
    }
    if (method === 'PUT') {
      tasks = tasks.map((t) => (t.id === id ? { ...t, ...body } : t))
      return json(
        200,
        tasks.find((t) => t.id === id),
      )
    }
    if (method === 'PATCH' && body) {
      if (opts.failMove) return json(500, { title: 'boom' })
      const moving = tasks.find((t) => t.id === id)
      if (!moving) return json(404, { title: 'not found' })
      const status = body.status ?? 'todo'
      const column = tasks
        .filter((t) => t.status === status && t.id !== id)
        .sort((a, b) => a.position - b.position)
      column.splice(Math.min(body.index ?? 0, column.length), 0, { ...moving, status })
      const renumbered = new Map(column.map((t, i) => [t.id, { ...t, position: (i + 1) * 1024 }]))
      tasks = tasks.map((t) => renumbered.get(t.id) ?? t)
      return json(
        200,
        tasks.find((t) => t.id === id),
      )
    }
    return json(404, { title: 'not found' })
  })

  vi.stubGlobal('fetch', fetchMock)
  return {
    calls,
    get tasks() {
      return tasks
    },
  }
}

export function makeTask(id: string, title: string, extra: Partial<Task> = {}): Task {
  return {
    id,
    title,
    description: null,
    status: 'todo',
    priority: 'medium',
    color: 'lavender',
    dueDate: null,
    position: 1024,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...extra,
  }
}
