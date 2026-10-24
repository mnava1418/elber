import type { ToolKind } from './types'

// The backend's tool names, as the UI shows them.
export const TOOL_KIND: Record<string, ToolKind> = {
  WebSearch: 'search',
  WebFetch: 'read',
  get_weather: 'weather',
  remember: 'remember',
  forget: 'forget',
}

export const toolKind = (name: string): ToolKind => TOOL_KIND[name] ?? 'search'

// For pages, the domain is enough: "Leyendo una página: ejemplo.com". The
// weather without a place is the user's location.
export function toolDetail(kind: ToolKind, detail = ''): string {
  if (kind === 'weather') return detail || 'tu ubicación'
  if (kind !== 'read') return detail
  try {
    return new URL(detail).hostname.replace(/^www\./, '')
  } catch {
    return detail
  }
}
