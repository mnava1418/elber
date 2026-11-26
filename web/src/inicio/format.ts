// Dates as the dashboard shows them, in the user's time zone.

const DAY = 86_400_000

// "Jueves 26 de noviembre".
export function longToday(date = new Date()) {
  const text = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// When a conversation was last updated: "Hoy, 9:40", "Ayer", "Lunes" or "12 nov".
export function whenUpdated(iso: string, now = new Date()) {
  const date = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const t = date.getTime()
  if (t >= startOfToday) return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`
  if (t >= startOfToday - DAY) return 'Ayer'
  if (t >= startOfToday - 6 * DAY) {
    const weekday = date.toLocaleDateString('es-MX', { weekday: 'long' })
    return weekday.charAt(0).toUpperCase() + weekday.slice(1)
  }
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')
}

// A "YYYY-MM-DD" day's initial: "L", "M", "J"... Read in UTC, like every
// day string, so the time zone never shifts it.
export const weekdayInitial = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('es-MX', { weekday: 'narrow', timeZone: 'UTC' }).toUpperCase()

// "es-MX" long weekday of a day, for screen readers: "jueves".
export const weekdayName = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' })
