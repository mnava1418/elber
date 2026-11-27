import { ApiError } from '../lib/api'

// What the login says when Firebase refuses. The web says "incorrect
// credentials" for everything; on a phone losing the signal is common, so
// network and rate-limit failures get their own message.
export function signInErrorMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  if (code === 'auth/network-request-failed') return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'
  if (code === 'auth/too-many-requests') return 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  return 'Correo y/o contraseña incorrectos.'
}

// Same messages as web/src/pages/RecoverPassword.tsx.
export function passwordResetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    if (error.status === 400) return 'Escribe un correo válido, por ejemplo tu@correo.com'
  }
  return 'No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.'
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
