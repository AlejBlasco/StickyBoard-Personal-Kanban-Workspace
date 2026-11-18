import { describe, expect, it } from 'vitest'
import {
  applyMove,
  dueState,
  findColumn,
  moveAcross,
  reorderWithin,
  toColumns,
  formatDueDate,
  toIsoDate,
} from './model'
import type { Task } from './types'

function task(
  id: string,
  status: Task['status'],
  position: number,
  extra: Partial<Task> = {},
): Task {
  return {
    id,
    title: id,
    description: null,
    status,
    priority: 'medium',
    color: 'lavender',
    dueDate: null,
    position,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...extra,
  }
}

const sample = [
  task('a', 'todo', 1024),
  task('b', 'todo', 2048),
  task('c', 'todo', 3072),
  task('x', 'done', 1024),
]

describe('applyMove', () => {
  it('reorders inside a column and renumbers positions', () => {
    const next = applyMove(sample, 'c', 'todo', 0)
    expect(toColumns(next).todo).toEqual(['c', 'a', 'b'])
    expect(
      next
        .filter((t) => t.status === 'todo')
        .map((t) => t.position)
        .sort(),
    ).toEqual([1024, 2048, 3072])
  })

  it('moves across columns and keeps completed tasks recoverable', () => {
    const next = applyMove(sample, 'x', 'inProgress', 0)
    expect(toColumns(next).done).toEqual([])
    expect(toColumns(next).inProgress).toEqual(['x'])
  })

  it('clamps an out-of-range index to the end', () => {
    expect(toColumns(applyMove(sample, 'a', 'todo', 999)).todo).toEqual(['b', 'c', 'a'])
  })

  it('ignores unknown ids', () => {
    expect(applyMove(sample, 'nope', 'todo', 0)).toBe(sample)
  })
})

describe('drag helpers', () => {
  const cols = toColumns(sample)

  it('finds a column by task id or by column drop id', () => {
    expect(findColumn(cols, 'x')).toBe('done')
    expect(findColumn(cols, 'column:inProgress')).toBe('inProgress')
  })

  it('moves across columns at the hovered item', () => {
    expect(moveAcross(cols, 'a', 'x').done).toEqual(['a', 'x'])
  })

  it('appends when hovering an empty column', () => {
    const next = moveAcross(cols, 'a', 'column:inProgress')
    expect(next.inProgress).toEqual(['a'])
    expect(next.todo).toEqual(['b', 'c'])
  })

  it('reorders within the same column only', () => {
    expect(reorderWithin(cols, 'a', 'c').todo).toEqual(['b', 'c', 'a'])
    expect(reorderWithin(cols, 'a', 'x')).toBe(cols)
  })
})

describe('dueState', () => {
  const today = '2026-11-18'

  it('classifies by calendar date', () => {
    expect(dueState({ dueDate: null, status: 'todo' }, today)).toBe('none')
    expect(dueState({ dueDate: '2026-11-17', status: 'todo' }, today)).toBe('overdue')
    expect(dueState({ dueDate: '2026-11-18', status: 'todo' }, today)).toBe('today')
    expect(dueState({ dueDate: '2026-11-21', status: 'inProgress' }, today)).toBe('soon')
    expect(dueState({ dueDate: '2026-11-22', status: 'todo' }, today)).toBe('later')
  })

  it('never marks completed tasks as overdue', () => {
    expect(dueState({ dueDate: '2020-01-01', status: 'done' }, today)).toBe('done')
  })

  it('formats local dates without UTC shifts', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('formatDueDate', () => {
  const now = new Date(2026, 10, 18)

  it('omits the year in the current year and shows it otherwise', () => {
    expect(formatDueDate('2026-12-01', now)).not.toMatch(/2026/)
    expect(formatDueDate('2099-01-01', now)).toMatch(/2099/)
  })
})
