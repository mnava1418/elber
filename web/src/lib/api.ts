import { auth } from './firebase'

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

interface RequestOptions {
  body?: unknown
  // Sends the signed-in user's Firebase ID token as `Authorization: Bearer`.
  auth?: boolean
}

// Network failures (server down, CORS, offline) reject with the fetch TypeError.
async function request<T>(method: string, path: string, { body, auth: withAuth = false }: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL no está configurada (ver web/.env.example)')

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (withAuth) {
    const user = auth?.currentUser
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'No hay sesión iniciada')
    // Cached by Firebase and refreshed when it is about to expire.
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  // null for empty answers (204).
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

export const apiPost = <T>(path: string, body: unknown) => request<T>('POST', path, { body })

export const apiGetAuth = <T>(path: string) => request<T>('GET', path, { auth: true })

export const apiPatchAuth = <T>(path: string, body: unknown) => request<T>('PATCH', path, { body, auth: true })

export const apiDeleteAuth = (path: string) => request<void>('DELETE', path, { auth: true })
