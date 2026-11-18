import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, hasActiveFilters, toQueryParams } from './filters'

describe('filters', () => {
  const now = new Date(2026, 10, 18, 10)

  it('always sends the local today and omits empty filters', () => {
    expect(toQueryParams(EMPTY_FILTERS, now)).toEqual({ today: '2026-11-18' })
  })

  it('combines all filters', () => {
    expect(
      toQueryParams(
        {
          q: '  demo ',
          status: 'todo',
          priority: 'high',
          due: 'overdue',
          dueFrom: '2026-11-01',
          dueTo: '2026-11-30',
        },
        now,
      ),
    ).toEqual({
      today: '2026-11-18',
      q: 'demo',
      status: 'todo',
      priority: 'high',
      due: 'overdue',
      dueFrom: '2026-11-01',
      dueTo: '2026-11-30',
    })
  })

  it('detects active filters', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, priority: 'low' })).toBe(true)
  })
})
