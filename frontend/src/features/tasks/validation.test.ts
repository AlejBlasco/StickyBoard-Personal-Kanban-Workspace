import { describe, expect, it } from 'vitest'
import { normalizeTitle, validateTaskForm } from './validation'

describe('validateTaskForm', () => {
  it('requires a title after whitespace normalization', () => {
    expect(validateTaskForm({ title: '   ', description: '' }).title).toBeDefined()
    expect(validateTaskForm({ title: 'ok', description: '' })).toEqual({})
  })

  it('enforces length limits', () => {
    expect(validateTaskForm({ title: 'a'.repeat(121), description: '' }).title).toBeDefined()
    expect(
      validateTaskForm({ title: 'a', description: 'b'.repeat(2001) }).description,
    ).toBeDefined()
  })

  it('collapses inner whitespace', () => {
    expect(normalizeTitle('  Hola   mundo ')).toBe('Hola mundo')
  })
})
