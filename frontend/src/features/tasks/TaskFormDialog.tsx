import { useId, useState, type FormEvent } from 'react'
import { ApiError } from '@/shared/api/client'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { useToast } from '@/shared/ui/toast'
import { useCreateTask, useUpdateTask } from './hooks'
import { PRIORITY_LABEL, STATUS_LABEL } from './model'
import {
  COLORS,
  DESCRIPTION_MAX,
  PRIORITIES,
  TITLE_MAX,
  type Task,
  type TaskColor,
  type TaskPriority,
  type TaskStatus,
} from './types'
import { normalizeTitle, validateTaskForm, type FormErrors } from './validation'

export type FormTarget = { kind: 'create'; status: TaskStatus } | { kind: 'edit'; task: Task }

const SWATCH: Record<TaskColor, string> = {
  lavender: 'bg-card-lavender',
  mint: 'bg-card-mint',
  peach: 'bg-card-peach',
  sky: 'bg-card-sky',
  lemon: 'bg-card-lemon',
  rose: 'bg-card-rose',
}
const COLOR_LABEL: Record<TaskColor, string> = {
  lavender: 'Lavanda',
  mint: 'Menta',
  peach: 'Melocotón',
  sky: 'Cielo',
  lemon: 'Limón',
  rose: 'Rosa',
}

export function TaskFormDialog({
  target,
  onClose,
}: {
  target: FormTarget | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={target?.kind === 'edit' ? 'Editar tarea' : 'Nueva tarea'}
      description={
        target?.kind === 'create'
          ? `Se añadirá a la columna «${STATUS_LABEL[target.status]}».`
          : 'Modifica los datos de la tarea.'
      }
    >
      {/* key remounts the form so each open starts from fresh values */}
      {target && (
        <TaskForm
          key={target.kind === 'edit' ? target.task.id : 'new'}
          target={target}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function TaskForm({ target, onClose }: { target: FormTarget; onClose: () => void }) {
  const id = useId()
  const toast = useToast()
  const create = useCreateTask()
  const update = useUpdateTask()
  const editing = target.kind === 'edit' ? target.task : null

  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(editing?.priority ?? 'medium')
  const [color, setColor] = useState<TaskColor>(editing?.color ?? 'lavender')
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const pending = create.isPending || update.isPending

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validateTaskForm({ title, description })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    const input = {
      title: normalizeTitle(title),
      description: description.trim() || null,
      priority,
      color,
      dueDate: dueDate || null,
    }
    try {
      if (target.kind === 'edit') {
        await update.mutateAsync({ id: target.task.id, input })
        toast.success('Tarea actualizada.')
      } else {
        await create.mutateAsync({ ...input, status: target.status })
        toast.success('Tarea creada.')
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors({
          title: err.fieldErrors.title?.[0],
          description: err.fieldErrors.description?.[0],
        })
      }
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la tarea.')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Título" htmlFor={`${id}-title`} error={errors.title}>
        <Input
          id={`${id}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX + 40}
          autoFocus
          required
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
          placeholder="¿Qué hay que hacer?"
        />
      </Field>

      <Field
        label="Descripción"
        htmlFor={`${id}-desc`}
        error={errors.description}
        hint={`Opcional · ${description.trim().length}/${DESCRIPTION_MAX}`}
      >
        <Textarea
          id={`${id}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? `${id}-desc-error` : undefined}
        />
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Prioridad</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className={cn(
                'flex h-10 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                priority === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name={`${id}-priority`}
                className="sr-only"
                checked={priority === p}
                onChange={() => setPriority(p)}
              />
              {PRIORITY_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label
              key={c}
              title={COLOR_LABEL[c]}
              className={cn(
                'relative size-9 cursor-pointer rounded-full border-2 transition-transform hover:scale-105 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                SWATCH[c],
                color === c ? 'border-foreground' : 'border-border',
              )}
            >
              <input
                type="radio"
                name={`${id}-color`}
                className="sr-only"
                checked={color === c}
                onChange={() => setColor(c)}
                aria-label={COLOR_LABEL[c]}
              />
              {color === c && (
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center text-sm font-bold text-card-foreground"
                >
                  ✓
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Fecha límite" htmlFor={`${id}-due`} hint="Opcional">
        <div className="flex gap-2">
          <Input
            id={`${id}-due`}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {dueDate && (
            <Button variant="ghost" onClick={() => setDueDate('')}>
              Quitar
            </Button>
          )}
        </div>
      </Field>

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          {formError}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  )
}
