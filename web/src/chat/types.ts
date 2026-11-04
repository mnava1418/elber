import type { Widget } from '../lib/socket'

export const MAX_CHARS = 4000
export const WARN_CHARS = 3600

export type ConnectionState = 'connecting' | 'open' | 'reconnecting' | 'rejected' | 'forbidden'

export type ToolKind = 'search' | 'read' | 'weather' | 'remember' | 'forget' | 'add_todo' | 'complete_todo' | 'list_todos'
  | 'save_note' | 'search_notes' | 'read_note' | 'update_note' | 'link_notes' | 'report_bug'
  | 'save_entry' | 'read_month' | 'list_months'

export interface ToolStep {
  id: string
  kind: ToolKind
  /** What goes after the colon: "clima en CDMX", "ejemplo.com", "Vive en CDMX". Empty: just the label */
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
  /** What the tools show next to the answer (a weather card…). */
  widgets: Widget[]
  /** With status 'error': the server didn't answer because of the rate limit; seconds to wait. */
  retryAfter?: number
}

export type Turn = UserTurn | ElberTurn

/** Events the server sends during one of Elber's turns */
export type ServerEvent =
  | { type: 'conversation'; turnId: string; id: string; title: string }
  | { type: 'tool_start'; turnId: string; step: { id: string; kind: ToolKind; detail: string } }
  | { type: 'tool_end'; turnId: string; stepId: string }
  | { type: 'delta'; turnId: string; text: string }
  | { type: 'sources'; turnId: string; sources: Source[] }
  | { type: 'widget'; turnId: string; widget: Widget }
  | { type: 'done'; turnId: string }
  | { type: 'error'; turnId: string; message?: string; rateLimited?: { retryAfter: number } }

export type SendResult = 'sent' | 'offline' | 'busy' | 'too_long' | 'empty'
