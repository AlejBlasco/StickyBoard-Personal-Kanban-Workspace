import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import { toIsoDate } from '../model'
import type { TaskInput, TaskQueryParams } from '../types'
import { buildSeed } from './demoSeed'
import { filterTasks, localTasksApi, resetDemoData } from './localApi'

const today = toIsoDate(new Date())
const params = (extra: Partial<TaskQueryParams> = {}): TaskQueryParams => ({ today, ...extra })

const input = (extra: Partial<TaskInput> = {}): TaskInput & { status: 'todo' } => ({
  title: 'Nueva',
  description: null,
  priority: 'medium',
  color: 'lavender',
  dueDate: null,
  status: 'todo',
  ...extra,
})

beforeEach(() => {
  localStorage.clear()
  resetDemoData()
})

describe('demo seed', () => {
  it('fills the three columns and shows overdue, today and upcoming dates relative to today', () => {
    const seed = buildSeed(new Date(2026, 10, 18, 12))
    expect(new Set(seed.map((t) => t.status))).toEqual(new Set(['todo', 'inProgress', 'done']))
    expect(seed.some((t) => t.dueDate === '2026-11-16' && t.status === 'todo')).toBe(true)
    expect(seed.some((t) => t.dueDate === '2026-11-18')).toBe(true)
    expect(seed.some((t) => t.dueDate === '2026-11-20')).toBe(true)
  })

  it('has unique ids and unique positions per column', () => {
    const seed = buildSeed()
    expect(new Set(seed.map((t) => t.id)).size).toBe(seed.length)
    for (const status of ['todo', 'inProgress', 'done'] as const) {
      const positions = seed.filter((t) => t.status === status).map((t) => t.position)
      expect(new Set(positions).size).toBe(positions.length)
    }
  })

  it('includes a completed task with a past due date (never overdue)', () => {
    expect(buildSeed().some((t) => t.status === 'done' && t.dueDate && t.dueDate < today)).toBe(
      true,
    )
  })
})

describe('localTasksApi', () => {
  it('lists the seed on first use and keeps data between reads', async () => {
    const first = await localTasksApi.list(params())
    expect(first.length).toBeGreaterThan(5)
    expect(await localTasksApi.list(params())).toEqual(first)
    expect(localStorage.getItem('stickyboard-demo-tasks-v1')).not.toBeNull()
  })

  it('creates at the end of the column with normalized text', async () => {
    const before = (await localTasksApi.list(params({ status: 'todo' }))).length
    const created = await localTasksApi.create(
      input({ title: '  Hola   mundo ', description: '  d  ' }),
    )

    expect(created.title).toBe('Hola mundo')
    expect(created.description).toBe('d')
    const column = await localTasksApi.list(params({ status: 'todo' }))
    expect(column).toHaveLength(before + 1)
    expect(column.at(-1)?.id).toBe(created.id)
  })

  it('rejects invalid input with the same field errors as the server', async () => {
    const err = await localTasksApi.create(input({ title: '   ' })).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(400)
    expect((err as ApiError).fieldErrors.title).toBeDefined()

    await expect(localTasksApi.create(input({ title: 'a'.repeat(121) }))).rejects.toBeInstanceOf(
      ApiError,
    )
    await expect(
      localTasksApi.create(input({ description: 'd'.repeat(2001) })),
    ).rejects.toBeInstanceOf(ApiError)
    // @ts-expect-error invalid color on purpose
    await expect(localTasksApi.create(input({ color: 'neon' }))).rejects.toBeInstanceOf(ApiError)
  })

  it('persists across a reload of the storage layer (data survives in localStorage)', async () => {
    const created = await localTasksApi.create(input({ title: 'Persistente' }))
    const raw = JSON.parse(localStorage.getItem('stickyboard-demo-tasks-v1') ?? '[]') as {
      id: string
    }[]
    expect(raw.some((t) => t.id === created.id)).toBe(true)
  })

  it('updates editable fields and touches updatedAt', async () => {
    const created = await localTasksApi.create(input())
    const updated = await localTasksApi.update(created.id, {
      title: 'Cambiada',
      description: 'x',
      priority: 'high',
      color: 'mint',
      dueDate: '2030-01-01',
    })
    expect(updated).toMatchObject({
      title: 'Cambiada',
      priority: 'high',
      color: 'mint',
      status: 'todo',
    })
    expect(updated.dueDate).toBe('2030-01-01')
    expect(updated.createdAt).toBe(created.createdAt)
  })

  it('deletes permanently and reports unknown ids as 404', async () => {
    const created = await localTasksApi.create(input())
    await localTasksApi.remove(created.id)
    expect((await localTasksApi.list(params())).some((t) => t.id === created.id)).toBe(false)
    await expect(localTasksApi.remove(created.id)).rejects.toMatchObject({ status: 404 })
    await expect(localTasksApi.update('nope', input())).rejects.toMatchObject({ status: 404 })
    await expect(localTasksApi.move('nope', 'todo', 0)).rejects.toMatchObject({ status: 404 })
  })

  it('moves between columns and within a column, clamping the index', async () => {
    const done = (await localTasksApi.list(params({ status: 'done' })))[0]
    expect(done).toBeDefined()
    await localTasksApi.move(done!.id, 'todo', 0)
    const todo = await localTasksApi.list(params({ status: 'todo' }))
    expect(todo[0]?.id).toBe(done!.id)

    await localTasksApi.move(done!.id, 'todo', 1_000_000)
    const reordered = await localTasksApi.list(params({ status: 'todo' }))
    expect(reordered.at(-1)?.id).toBe(done!.id)
    const positions = reordered.map((t) => t.position)
    expect(new Set(positions).size).toBe(positions.length)
  })

  it('validates move arguments', async () => {
    const [first] = await localTasksApi.list(params())
    await expect(localTasksApi.move(first!.id, 'todo', -1)).rejects.toMatchObject({ status: 400 })
    // @ts-expect-error invalid status on purpose
    await expect(localTasksApi.move(first!.id, 'archived', 0)).rejects.toMatchObject({
      status: 400,
    })
  })

  it('resetDemoData restores the original sample', async () => {
    const original = (await localTasksApi.list(params())).length
    const created = await localTasksApi.create(input())
    await localTasksApi.remove((await localTasksApi.list(params()))[0]!.id)
    resetDemoData()
    const after = await localTasksApi.list(params())
    expect(after).toHaveLength(original)
    expect(after.some((t) => t.id === created.id)).toBe(false)
  })

  it('recovers from corrupted storage by falling back to a valid state', async () => {
    localStorage.setItem('stickyboard-demo-tasks-v1', '{not json')
    resetDemoData()
    expect((await localTasksApi.list(params())).length).toBeGreaterThan(0)
  })
})

describe('filterTasks (same semantics as the API)', () => {
  const tasks = buildSeed(new Date(2026, 10, 18, 12))
  const t = '2026-11-18'

  it('searches title and description case-insensitively, treating wildcards as text', () => {
    expect(filterTasks(tasks, { today: t, q: 'NVDA' }).length).toBe(1)
    expect(filterTasks(tasks, { today: t, q: 'arquitectura' }).length).toBeGreaterThanOrEqual(1)
    // '%' is literal text: it matches only the description that really contains it, not everything
    expect(filterTasks(tasks, { today: t, q: '%' })).toHaveLength(1)
    expect(filterTasks(tasks, { today: t, q: '_' })).toHaveLength(0)
  })

  it('filters by status and priority and combines them', () => {
    const high = filterTasks(tasks, { today: t, priority: 'high' })
    expect(high.every((x) => x.priority === 'high')).toBe(true)
    const combined = filterTasks(tasks, { today: t, priority: 'high', status: 'todo' })
    expect(combined.every((x) => x.priority === 'high' && x.status === 'todo')).toBe(true)
    expect(combined.length).toBeLessThan(high.length)
  })

  it('applies due semantics: overdue excludes done, upcoming is the next 7 days, none = no date', () => {
    const overdue = filterTasks(tasks, { today: t, due: 'overdue' })
    expect(overdue.length).toBeGreaterThan(0)
    expect(overdue.every((x) => x.status !== 'done' && x.dueDate! < t)).toBe(true)

    expect(filterTasks(tasks, { today: t, due: 'today' }).every((x) => x.dueDate === t)).toBe(true)
    expect(
      filterTasks(tasks, { today: t, due: 'upcoming' })
        .map((x) => x.dueDate)
        .sort(),
    ).toEqual(['2026-11-20', '2026-11-23'])
    expect(filterTasks(tasks, { today: t, due: 'none' }).every((x) => x.dueDate === null)).toBe(
      true,
    )
  })

  it('treats dueFrom/dueTo as an inclusive range and ignores tasks without date', () => {
    const range = filterTasks(tasks, { today: t, dueFrom: '2026-11-18', dueTo: '2026-11-20' })
    expect(range.map((x) => x.dueDate).sort()).toEqual(['2026-11-18', '2026-11-20'])
  })
})
