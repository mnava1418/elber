import { envResult } from '../config/env'
import { auth } from './firebase'

// Copy of web/src/lib/api.ts: change both together.

// Base URL of the backend, including the version prefix, e.g.
// https://elber-api.namart.tech/api/v1 (env.ts already trims trailing slashes).
const API_URL = envResult.ok ? envResult.env.apiUrl : ''

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
  signal?: AbortSignal
}

// The request never got an answer: no connection, or the server is down or
// unreachable. The web relies on fetch's TypeError for this, but on a phone
// the error depends on the platform (Android's fetch rejects with a plain
// Error, "fetch failed: java.net.ConnectException..."), so every fetch
// failure becomes this one. An abort is left as it is.
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause })
    this.name = 'NetworkError'
  }
}

const isAbort = (error: unknown) => (error as { name?: unknown } | null)?.name === 'AbortError'

async function send(method: string, path: string, { body, auth: withAuth = false, signal }: RequestOptions): Promise<Response> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL no está configurada (ver mobile/.env.example)')

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (withAuth) {
    const user = auth?.currentUser
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'No hay sesión iniciada')
    // Cached by Firebase and refreshed when it is about to expire.
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    throw isAbort(error) ? error : new NetworkError(error)
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      data?.error?.code ?? 'UNKNOWN_ERROR',
      data?.error?.message ?? response.statusText,
    )
  }
  return response
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(method, path, options)
  // null for empty answers (204).
  return (await response.json().catch(() => null)) as T
}

export const apiPost = <T>(path: string, body: unknown) => request<T>('POST', path, { body })

export const apiGetAuth = <T>(path: string) => request<T>('GET', path, { auth: true })

export const apiPostAuth = <T>(path: string, body: unknown) => request<T>('POST', path, { body, auth: true })

export const apiPutAuth = <T>(path: string, body: unknown) => request<T>('PUT', path, { body, auth: true })

export const apiPatchAuth = <T>(path: string, body: unknown) => request<T>('PATCH', path, { body, auth: true })

export const apiDeleteAuth = (path: string) => request<void>('DELETE', path, { auth: true })
