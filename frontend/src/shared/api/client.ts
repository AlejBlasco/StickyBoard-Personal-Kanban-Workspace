export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface ProblemDetails {
  title?: string
  errors?: Record<string, string[]>
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/v1${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  if (res.status === 204) return undefined as T

  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const problem = (body ?? {}) as ProblemDetails
    throw new ApiError(
      res.status,
      problem.title ?? 'Error inesperado del servidor.',
      problem.errors,
    )
  }
  return body as T
}
