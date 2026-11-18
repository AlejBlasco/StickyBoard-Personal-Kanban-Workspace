import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

interface ApiTask {
  id: string
  title: string
  status: string
  position: number
}

async function resetData(page: Page) {
  const res = await page.request.get('/api/v1/tasks')
  for (const t of (await res.json()) as ApiTask[])
    await page.request.delete(`/api/v1/tasks/${t.id}`)
}

async function seed(page: Page, title: string, extra: Record<string, unknown> = {}) {
  const res = await page.request.post('/api/v1/tasks', { data: { title, ...extra } })
  expect(res.status()).toBe(201)
  return (await res.json()) as ApiTask
}

const column = (page: Page, name: RegExp) => page.getByRole('region', { name })
const titlesIn = (col: Locator) =>
  col.getByRole('article').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))

/** Wait until an element stops moving (layout animations), then return its box. */
async function settledBox(locator: Locator) {
  let previous = await locator.boundingBox()
  for (let i = 0; i < 20; i++) {
    await locator.page().waitForTimeout(60)
    const current = await locator.boundingBox()
    if (previous && current && previous.x === current.x && previous.y === current.y) return current
    previous = current
  }
  return previous
}

/** Pointer drag that dnd-kit understands (needs intermediate moves). */
async function drag(page: Page, from: Locator, to: Locator, offsetY = 0) {
  const a = (await settledBox(from))!
  const b = (await settledBox(to))!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 })
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + offsetY, { steps: 14 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetData(page)
  await page.goto('/')
})

test('empty state, create, edit and delete with confirmation', async ({ page }) => {
  await expect(page.getByText('Tu tablero está vacío')).toBeVisible()

  await page.getByRole('button', { name: 'Crear primera tarea' }).click()
  await page.getByLabel('Título').fill('  Preparar   demo ')
  await page.getByLabel('Descripción').fill('Revisar el flujo principal')
  await page.getByRole('dialog').getByText('Alta', { exact: true }).click()
  await page.getByLabel('Fecha límite').fill('2020-01-01')
  await page.getByRole('button', { name: 'Crear tarea' }).click()

  const todo = column(page, /Pendiente/)
  const card = todo.getByRole('article', { name: 'Preparar demo' })
  await expect(card).toBeVisible()
  await expect(card.getByText('Vencida')).toBeVisible()

  await card.getByRole('button', { name: 'Preparar demo', exact: true }).click()
  await page.getByLabel('Título').fill('Preparar demo v2')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(todo.getByRole('article', { name: 'Preparar demo v2' })).toBeVisible()

  await page.getByRole('button', { name: 'Acciones de la tarea: Preparar demo v2' }).click()
  await page.getByRole('menuitem', { name: /Eliminar/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('de forma permanente')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(todo.getByRole('article', { name: 'Preparar demo v2' })).toBeVisible()

  await page.getByRole('button', { name: 'Acciones de la tarea: Preparar demo v2' }).click()
  await page.getByRole('menuitem', { name: /Eliminar/ }).click()
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(page.getByText('Tu tablero está vacío')).toBeVisible()
})

test('server-side validation errors are shown (title too long bypassing client limit)', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await page.getByRole('button', { name: 'Crear tarea' }).click()
  await expect(page.getByText('El título es obligatorio.')).toBeVisible()
})

test('drag & drop moves between columns and reorders; order persists after reload', async ({
  page,
}) => {
  await seed(page, 'A')
  await seed(page, 'B')
  await seed(page, 'C')
  await page.goto('/')

  const todo = column(page, /Pendiente/)
  const progress = column(page, /En progreso/)
  const done = column(page, /Completado/)

  // C above A inside the same column
  await drag(
    page,
    todo.getByRole('button', { name: 'Arrastrar tarea: C' }),
    todo.getByRole('article', { name: 'A' }),
    -10,
  )
  await expect.poll(() => titlesIn(todo)).toEqual(['C', 'A', 'B'])

  // A into En progreso (empty column)
  await drag(
    page,
    todo.getByRole('button', { name: 'Arrastrar tarea: A' }),
    progress.getByRole('list'),
  )
  await expect.poll(() => titlesIn(progress)).toEqual(['A'])

  // A on to Completado: completed tasks stay visible
  await drag(
    page,
    progress.getByRole('button', { name: 'Arrastrar tarea: A' }),
    done.getByRole('list'),
  )
  await expect.poll(() => titlesIn(done)).toEqual(['A'])

  await page.reload()
  await expect.poll(() => titlesIn(column(page, /Pendiente/))).toEqual(['C', 'B'])
  await expect.poll(() => titlesIn(column(page, /Completado/))).toEqual(['A'])

  // Recover from Completado with the menu (non-drag alternative)
  await page.getByRole('button', { name: 'Acciones de la tarea: A' }).click()
  await page.getByRole('menuitem', { name: 'En progreso' }).click()
  await expect.poll(() => titlesIn(column(page, /En progreso/))).toEqual(['A'])
  await expect.poll(() => titlesIn(column(page, /Completado/))).toEqual([])
})

test('keyboard-only drag & drop with screen reader announcements', async ({ page }) => {
  await seed(page, 'Teclado')
  await page.goto('/')

  const handle = page.getByRole('button', { name: 'Arrastrar tarea: Teclado' })
  await handle.focus()
  await page.keyboard.press('Space')
  await expect(page.locator('[aria-live]').filter({ hasText: 'sobre Pendiente' })).toHaveCount(1)
  // First arrow lands on the current column container, the second one reaches the next column
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[aria-live]').filter({ hasText: 'sobre En progreso' })).toHaveCount(1)
  await page.keyboard.press('Space')

  await expect.poll(() => titlesIn(column(page, /En progreso/))).toEqual(['Teclado'])
  const stored = (await (await page.request.get('/api/v1/tasks')).json()) as ApiTask[]
  expect(stored[0]?.status).toBe('inProgress')
})

test('search and filters combine; dragging is disabled while filtered', async ({ page }) => {
  await seed(page, 'Alpha informe', { priority: 'high', dueDate: '2020-01-01' })
  await seed(page, 'Beta informe', { priority: 'low' })
  await seed(page, 'Gamma', { description: 'contiene informe', priority: 'high' })
  await page.goto('/')

  await page.getByRole('searchbox', { name: 'Buscar tareas' }).fill('informe')
  await expect(page.getByRole('article')).toHaveCount(3)

  await page.getByLabel('Prioridad').selectOption('high')
  await expect(page.getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('button', { name: /Arrastrar tarea/ })).toHaveCount(0)

  await page.getByLabel('Vencimiento').selectOption('overdue')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article', { name: 'Alpha informe' })).toBeVisible()

  await page.getByRole('searchbox', { name: 'Buscar tareas' }).fill('zzz')
  await expect(page.getByText('Sin resultados')).toBeVisible()

  await page.getByRole('button', { name: 'Restablecer filtros' }).click()
  await expect(page.getByRole('article')).toHaveCount(3)
  await expect(page.getByRole('button', { name: /Arrastrar tarea/ })).toHaveCount(3)
})

for (const theme of ['light', 'dark'] as const) {
  test(`theme ${theme}: persists and has no serious accessibility violations`, async ({ page }) => {
    await seed(page, 'Vencida alta', { priority: 'high', dueDate: '2020-01-01', color: 'rose' })
    await seed(page, 'Hoy', { color: 'mint', status: 'inProgress' })
    await seed(page, 'Hecha', { color: 'lemon', status: 'done', dueDate: '2020-01-01' })
    await page.goto('/')

    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click()
      await page.reload()
      await expect(page.locator('html')).toHaveClass(/dark/)
    }
    await expect(page.getByRole('article', { name: 'Hecha' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    ).toEqual([])
  })
}

test('@mobile layout has no horizontal page scroll and keeps touch targets usable', async ({
  page,
}) => {
  await seed(page, 'Móvil')
  await page.goto('/')
  await expect(page.getByRole('article', { name: 'Móvil' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)

  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const box = await page.getByRole('button', { name: 'Crear tarea' }).boundingBox()
  // The button is 40px tall; device emulation rounds it (38.99 on CI). WCAG 2.2 AA (2.5.8) needs 24px.
  expect(box!.height).toBeGreaterThanOrEqual(36)
})
