// Copy of web/src/chat/tools.ts (except hostOf): change both together.
import type { ToolKind } from './types'

// The backend's tool names, as the UI shows them.
export const TOOL_KIND: Record<string, ToolKind> = {
  WebSearch: 'search',
  WebFetch: 'read',
  get_weather: 'weather',
  remember: 'remember',
  forget: 'forget',
  add_todo: 'add_todo',
  complete_todo: 'complete_todo',
  list_todos: 'list_todos',
  save_note: 'save_note',
  search_notes: 'search_notes',
  read_note: 'read_note',
  update_note: 'update_note',
  link_notes: 'link_notes',
  report_bug: 'report_bug',
  save_entry: 'save_entry',
  read_month: 'read_month',
  list_months: 'list_months',
  get_coaching_guide: 'get_coaching_guide',
  get_training_profile: 'get_training_profile',
  update_training_profile: 'update_training_profile',
  get_plans: 'get_plans',
  // Its old name, in conversations saved before it changed.
  get_active_plan: 'get_plans',
  create_plan: 'create_plan',
  update_plan: 'update_plan',
  get_training_progress: 'get_training_progress',
}

export const toolKind = (name: string): ToolKind => TOOL_KIND[name] ?? 'search'

// A URL's host without "www.". React Native's URL doesn't implement
// `hostname`, so it is read with a pattern; null when it isn't a URL.
export function hostOf(url: string): string | null {
  const host = url.match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#@]*@)?([^/?#:]+)/i)?.[1]
  return host ? host.toLowerCase().replace(/^www\./, '') : null
}

// For pages, the domain is enough: "Leyendo una página: ejemplo.com". The
// weather without a place is the user's location.
export function toolDetail(kind: ToolKind, detail = ''): string {
  if (kind === 'weather') return detail || 'tu ubicación'
  if (kind !== 'read') return detail
  return hostOf(detail) ?? detail
}
