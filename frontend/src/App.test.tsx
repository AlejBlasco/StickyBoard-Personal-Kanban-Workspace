import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ToastProvider } from '@/shared/ui/toast'
import { installFakeApi, makeTask } from '@/test/fakeApi'

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

const seed = () => [
  makeTask('1', 'Preparar demo', { description: 'Revisar el flujo', priority: 'high' }),
  makeTask('2', 'Escribir docs', { status: 'inProgress' }),
  makeTask('3', 'Publicar release', { status: 'done', dueDate: '2020-01-01' }),
]

describe('App', () => {
  it('renders the three columns with tasks, completed ones included', async () => {
    installFakeApi(seed())
    renderApp()
    expect(await screen.findByRole('heading', { name: /Pendiente/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /En progreso/ })).toBeInTheDocument()
    const done = screen.getByRole('region', { name: /Completado/ })
    expect(within(done).getByText('Publicar release')).toBeInTheDocument()
    // completed tasks are never flagged as overdue
    expect(within(done).queryByText(/Vencida/)).not.toBeInTheDocument()
  })

  it('shows the empty state and creates a first task', async () => {
    const api = installFakeApi([])
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: /Crear primera tarea/ }))
    await userEvent.type(screen.getByLabelText('Título'), 'Mi primera nota')
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))
    expect(await screen.findByText('Mi primera nota')).toBeInTheDocument()
    expect(api.calls.some((c) => c.method === 'POST')).toBe(true)
  })

  it('validates the title before calling the API', async () => {
    const api = installFakeApi(seed())
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: /Nueva tarea/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))
    expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument()
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(0)
  })

  it('requires confirmation before permanently deleting', async () => {
    const api = installFakeApi(seed())
    renderApp()
    await screen.findByText('Preparar demo')
    await userEvent.click(
      screen.getByRole('button', { name: 'Acciones de la tarea: Preparar demo' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: /Eliminar/ }))
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(false)
    await userEvent.click(await screen.findByRole('button', { name: /Eliminar definitivamente/ }))
    await waitFor(() => expect(screen.queryByText('Preparar demo')).not.toBeInTheDocument())
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(true)
  })

  it('moves a task out of Completado from the menu (keyboard-accessible alternative)', async () => {
    const api = installFakeApi(seed())
    renderApp()
    await screen.findByText('Publicar release')
    await userEvent.click(
      screen.getByRole('button', { name: 'Acciones de la tarea: Publicar release' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pendiente' }))
    const todo = screen.getByRole('region', { name: /Pendiente/ })
    await waitFor(() => expect(within(todo).getByText('Publicar release')).toBeInTheDocument())
    expect(api.calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({ status: 'todo' })
  })

  it('rolls back the optimistic move and reports the error when the API fails', async () => {
    installFakeApi(seed(), { failMove: true })
    renderApp()
    await screen.findByText('Publicar release')
    await userEvent.click(
      screen.getByRole('button', { name: 'Acciones de la tarea: Publicar release' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pendiente' }))
    expect(await screen.findByText(/No se pudo mover la tarea/)).toBeInTheDocument()
    const done = screen.getByRole('region', { name: /Completado/ })
    await waitFor(() => expect(within(done).getByText('Publicar release')).toBeInTheDocument())
  })

  it('searches and combines filters, with a reset and a no-results state', async () => {
    const api = installFakeApi(seed())
    renderApp()
    await screen.findByText('Preparar demo')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar tareas' }), 'zzz')
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
    expect(api.calls.some((c) => c.url.includes('q=zzz'))).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Restablecer filtros' }))
    expect(await screen.findByText('Preparar demo')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'high')
    await waitFor(() => expect(screen.queryByText('Escribir docs')).not.toBeInTheDocument())
    expect(screen.getByText('Preparar demo')).toBeInTheDocument()
    expect(api.calls.some((c) => c.url.includes('priority=high'))).toBe(true)
  })

  it('shows an error state with retry when the list fails', async () => {
    installFakeApi([], { failList: true })
    renderApp()
    expect(await screen.findByText('No se pudieron cargar las tareas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })

  it('toggles between light and dark themes and remembers the choice', async () => {
    installFakeApi(seed())
    renderApp()
    await screen.findByText('Preparar demo')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('stickyboard-theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
