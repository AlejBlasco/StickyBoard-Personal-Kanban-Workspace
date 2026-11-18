import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

const column = (page: Page, name: RegExp) => page.getByRole('region', { name })
const titlesIn = (col: Locator) =>
  col.getByRole('article').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))

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

async function drag(page: Page, from: Locator, to: Locator) {
  const a = (await settledBox(from))!
  const b = (await settledBox(to))!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 })
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 })
  await page.mouse.up()
}

// Every test runs in a fresh browser context, so each one starts as a first-time visitor.

test('shows the demo banner and seeded board without calling any API', async ({ page }) => {
  const apiCalls: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/')) apiCalls.push(r.url())
  })

  await page.goto('/')
  await expect(page.getByLabel('Aviso de modo demo')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver código/ })).toHaveAttribute(
    'href',
    /github\.com/,
  )

  await expect(column(page, /Pendiente/).getByRole('article')).not.toHaveCount(0)
  await expect(column(page, /En progreso/).getByRole('article')).not.toHaveCount(0)
  await expect(column(page, /Completado/).getByRole('article')).not.toHaveCount(0)
  await expect(page.getByRole('article').getByText('Vencida').first()).toBeVisible()

  expect(apiCalls).toEqual([])
})

test('create, edit and delete work and persist after reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await page.getByLabel('Título').fill('Mi tarea de prueba')
  await page.getByRole('button', { name: 'Crear tarea' }).click()
  await expect(page.getByRole('article', { name: 'Mi tarea de prueba' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('article', { name: 'Mi tarea de prueba' })).toBeVisible()

  await page
    .getByRole('article', { name: 'Mi tarea de prueba' })
    .getByRole('button', { name: 'Mi tarea de prueba', exact: true })
    .click()
  await page.getByLabel('Título').fill('Mi tarea editada')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('article', { name: 'Mi tarea editada' })).toBeVisible()

  await page.getByRole('button', { name: 'Acciones de la tarea: Mi tarea editada' }).click()
  await page.getByRole('menuitem', { name: /Eliminar/ }).click()
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(page.getByRole('article', { name: 'Mi tarea editada' })).toHaveCount(0)
})

test('drag & drop moves a card to Completado and the order persists after reload', async ({
  page,
}) => {
  await page.goto('/')
  const progress = column(page, /En progreso/)
  const done = column(page, /Completado/)
  const title = 'Pulir las microinteracciones'

  await drag(
    page,
    progress.getByRole('button', { name: `Arrastrar tarea: ${title}` }),
    done.getByRole('list'),
  )
  await expect.poll(() => titlesIn(column(page, /Completado/))).toContain(title)

  await page.reload()
  await expect.poll(() => titlesIn(column(page, /Completado/))).toContain(title)
  await expect.poll(() => titlesIn(column(page, /En progreso/))).not.toContain(title)
})

test('search and filters work against local data', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Buscar tareas' }).fill('accesibilidad')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Restablecer', exact: true }).click()
  await page.getByLabel('Vencimiento').selectOption('overdue')
  await expect(page.getByRole('article', { name: /feedback/ })).toBeVisible()
  await expect(page.getByRole('article', { name: /arquitectura limpia/ })).toHaveCount(0)
})

test('reset restores the sample data after changes', async ({ page }) => {
  await page.goto('/')
  const before = await page.getByRole('article').count()

  await page
    .getByRole('button', { name: 'Acciones de la tarea: Pulir las microinteracciones' })
    .click()
  await page.getByRole('menuitem', { name: /Eliminar/ }).click()
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(page.getByRole('article')).toHaveCount(before - 1)

  await page.getByRole('button', { name: 'Restablecer demo' }).click()
  await expect(page.getByRole('article')).toHaveCount(before)
})

for (const theme of ['light', 'dark'] as const) {
  test(`demo ${theme} theme has no serious accessibility violations`, async ({ page }) => {
    await page.goto('/')
    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
    }
    await expect(page.getByLabel('Aviso de modo demo')).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()

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
