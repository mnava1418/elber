// Base URL of the backend, including the version prefix,
// e.g. http://localhost:3000/api/v1. Trailing slashes are ignored.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

// Error answered by the backend: { error: { code, message } }.
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Network failures (server down, CORS, offline) reject with the fetch TypeError.
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL no está configurada (ver web/.env.example)')

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.code ?? 'UNKNOWN_ERROR',
      data?.error?.message ?? response.statusText,
    )
  }
  return data as T
}
