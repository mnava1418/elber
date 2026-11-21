// Training dates are calendar days as YYYY-MM-DD, as the user's device sees
// them: the server (in UTC) never decides which day it is for the user. The
// math runs in UTC on purpose, so a daylight saving change never moves a day.

const parse = (date: string): Date => new Date(`${date}T00:00:00Z`)
const format = (date: Date): string => date.toISOString().slice(0, 10)

// A real day: "2026-02-30" has the right shape but isn't one.
export const isIsoDate = (value: string): boolean =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parse(value).getTime()) && format(parse(value)) === value

export const addDays = (date: string, days: number): string => {
    const day = parse(date)
    day.setUTCDate(day.getUTCDate() + days)
    return format(day)
}

// The same day of a later month, or its last day when it is shorter
// (January 31 + 1 month = February 28).
export const addMonths = (date: string, months: number): string => {
    const day = parse(date)
    const target = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + months, 1))
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    target.setUTCDate(Math.min(day.getUTCDate(), lastDay))
    return format(target)
}

// Weeks start on Monday.
export const mondayOf = (date: string): string => addDays(date, -((parse(date).getUTCDay() + 6) % 7))
