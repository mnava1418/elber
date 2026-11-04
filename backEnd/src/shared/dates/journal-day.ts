import { localIsoDate } from './local-date.js'

// Before this hour a diary day hasn't ended yet: talking at 00:30 is about
// the day that just finished.
const CUTOFF_HOUR = 4
const LOCALE = 'es-MX'

export interface JournalDay {
    // YYYY-MM-DD.
    date: string
    // "lunes 2 de noviembre", to name its conversation.
    title: string
}

// The diary day `now` belongs to, in the server's timezone (the user's, as
// Elber runs on their machine).
export const journalDay = (now = new Date()): JournalDay => {
    const day = new Date(now)
    if (day.getHours() < CUTOFF_HOUR) day.setDate(day.getDate() - 1)
    const title = day.toLocaleDateString(LOCALE, {weekday: 'long', day: 'numeric', month: 'long'}).replace(',', '')
    return {date: localIsoDate(day), title}
}

// "lunes" for "2026-11-02".
export const weekdayOf = (date: string): string => {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number]
    return new Date(year, month - 1, day).toLocaleDateString(LOCALE, {weekday: 'long'})
}
