import { MAX_CHARS, type ConnectionState } from './types'

export const fmt = (n: number) => n.toLocaleString('es-MX')

// Why the composer can't send, or null when it can (web/src/chat/Composer.tsx).
// There's no "Enter to send" hint: on a phone the button sends and Enter is a new line.
export function composerHint(connection: ConnectionState, over: boolean): string | null {
  if (connection === 'connecting') return 'Conectando con Elber…'
  if (connection === 'reconnecting') return 'Sin conexión. Podrás escribir cuando Elber vuelva.'
  if (connection === 'rejected') return 'Inicia sesión de nuevo para seguir escribiendo.'
  if (connection === 'forbidden') return 'Esta sección no está disponible para tu cuenta.'
  if (over) return `Tu mensaje supera el límite de ${fmt(MAX_CHARS)} caracteres. Acórtalo para enviarlo.`
  return null
}
