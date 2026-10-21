export const MAX_CHARS = 4000
export const WARN_CHARS = 3600

export type ConnectionState = 'connecting' | 'open' | 'reconnecting' | 'rejected'

export type ToolKind = 'search' | 'read'

export interface ToolStep {
  id: string
  kind: ToolKind
  /** Lo que va después de los dos puntos: "clima en CDMX", "ejemplo.com" */
  detail: string
  status: 'running' | 'done'
}

export interface Source {
  n: number
  url: string
  title: string
}

export interface UserTurn {
  id: string
  role: 'user'
  text: string
}

export type ElberStatus = 'thinking' | 'streaming' | 'done' | 'stopped' | 'error'

export interface ElberTurn {
  id: string
  role: 'elber'
  replyTo: string
  status: ElberStatus
  text: string
  steps: ToolStep[]
  sources: Source[]
}

export type Turn = UserTurn | ElberTurn

/** Eventos que el servidor envía durante un turno de Elber */
export type ServerEvent =
  | { type: 'conversation'; turnId: string; id: string; title: string }
  | { type: 'tool_start'; turnId: string; step: { id: string; kind: ToolKind; detail: string } }
  | { type: 'tool_end'; turnId: string; stepId: string }
  | { type: 'delta'; turnId: string; text: string }
  | { type: 'sources'; turnId: string; sources: Source[] }
  | { type: 'done'; turnId: string }
  | { type: 'error'; turnId: string; message?: string }

export type SendResult = 'sent' | 'offline' | 'busy' | 'too_long' | 'empty'
