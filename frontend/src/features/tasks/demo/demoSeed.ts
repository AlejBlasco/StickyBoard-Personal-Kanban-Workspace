import { parseIsoDate, POSITION_STEP, toIsoDate } from '../model'
import type { Task, TaskColor, TaskPriority, TaskStatus } from '../types'

function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

interface SeedItem {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  color: TaskColor
  /** Days from today; undefined = no due date */
  due?: number
}

const SEED: SeedItem[] = [
  {
    title: 'Responder al feedback de la revisión',
    description: 'Una tarea pendiente con la fecha límite ya pasada: se marca como vencida.',
    status: 'todo',
    priority: 'high',
    color: 'rose',
    due: -2,
  },
  {
    title: 'Revisar la accesibilidad con lector de pantalla',
    description: 'Prueba con NVDA, zoom al 200 % y navegación solo con teclado.',
    status: 'todo',
    priority: 'high',
    color: 'sky',
    due: 2,
  },
  {
    title: 'Añadir soporte multi idioma',
    status: 'todo',
    priority: 'medium',
    color: 'lavender',
    due: 14,
  },
  {
    title: 'Escribir el post del proyecto',
    description: 'Arquitectura limpia, drag & drop accesible y seguridad de una app local.',
    status: 'todo',
    priority: 'low',
    color: 'lemon',
  },
  {
    title: 'Publicar la demo en GitHub Pages',
    description: 'Arrastra esta tarjeta a «Completado» con el ratón o con el teclado.',
    status: 'inProgress',
    priority: 'high',
    color: 'peach',
    due: 0,
  },
  {
    title: 'Pulir las microinteracciones',
    status: 'inProgress',
    priority: 'medium',
    color: 'mint',
    due: 5,
  },
  {
    title: 'Diseñar la arquitectura limpia',
    description: 'Domain, Application, Infrastructure y Api.',
    status: 'done',
    priority: 'medium',
    color: 'lavender',
    due: -3,
  },
  {
    title: 'Configurar la CI en GitHub Actions',
    status: 'done',
    priority: 'medium',
    color: 'sky',
  },
]

/** Demo data relative to today, so the board always looks alive (overdue, today, soon, later). */
export function buildSeed(now = new Date()): Task[] {
  const today = toIsoDate(now)
  const stamp = now.toISOString()
  const perColumn: Record<TaskStatus, number> = { todo: 0, inProgress: 0, done: 0 }

  return SEED.map((item, index) => {
    perColumn[item.status] += 1
    return {
      id: `demo-${index + 1}`,
      title: item.title,
      description: item.description ?? null,
      status: item.status,
      priority: item.priority,
      color: item.color,
      dueDate: item.due === undefined ? null : addDays(today, item.due),
      position: perColumn[item.status] * POSITION_STEP,
      createdAt: stamp,
      updatedAt: stamp,
    }
  })
}
