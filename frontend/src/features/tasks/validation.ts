import { DESCRIPTION_MAX, TITLE_MAX } from './types'

export type FormErrors = Partial<Record<'title' | 'description' | 'dueDate', string>>

export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim()
}

/** Client-side convenience only; the server validates again. */
export function validateTaskForm(values: { title: string; description: string }): FormErrors {
  const errors: FormErrors = {}
  const title = normalizeTitle(values.title)
  if (!title) errors.title = 'El título es obligatorio.'
  else if (title.length > TITLE_MAX) errors.title = `Máximo ${TITLE_MAX} caracteres.`
  if (values.description.trim().length > DESCRIPTION_MAX)
    errors.description = `Máximo ${DESCRIPTION_MAX} caracteres.`
  return errors
}
