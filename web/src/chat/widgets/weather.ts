// Data of the 'weather' widget. Copy of WeatherReport in
// backEnd/src/modules/weather/domain/weather.ts: change both together.
// Times are the place's local time, "YYYY-MM-DDTHH:mm" (dates "YYYY-MM-DD").
// Temperatures in °C, wind in km/h, rain and snow in mm, chances 0-100.
// Icons are OpenWeather codes, e.g. "10d".
export interface WeatherReport {
  place: { name: string; state?: string; country: string; lat: number; lon: number }
  localTime: string
  current: {
    description: string
    icon: string
    temp: number
    feelsLike: number
    humidity: number
    windKmh: number
    uvIndex: number
  }
  hourly: {
    time: string
    description: string
    icon: string
    temp: number
    rainChance: number
    rainMm?: number
    snowMm?: number
  }[]
  daily: {
    date: string
    summary: string
    icon: string
    min: number
    max: number
    rainChance: number
    rainMm?: number
    snowMm?: number
  }[]
  alerts: { event: string; start: string; end: string; description: string }[]
}

// The times are already local: read them as UTC so the browser's time zone
// doesn't move them.
const asDate = (localTime: string) => new Date(`${localTime.length === 10 ? `${localTime}T00:00` : localTime}Z`)

const weekday = new Intl.DateTimeFormat('es', { weekday: 'short', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "20:30" */
export const hourOf = (localTime: string) => localTime.slice(11, 16)

/** "Hoy", "Mañana", "vie." */
export function dayLabel(date: string, today: string): string {
  const days = Math.round((asDate(date).getTime() - asDate(today).getTime()) / 86_400_000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  return weekday.format(asDate(date))
}

/** "viernes, 23 oct" */
export const longDate = (localTime: string) => longDay.format(asDate(localTime))

/** Whole degrees: the card is read at a glance. */
export const deg = (t: number) => `${Math.round(t)}°`

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
