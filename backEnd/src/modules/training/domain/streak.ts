import { addDays, mondayOf } from './days.js'
import type { Plan } from './plan.js'

// With no plan and no daysPerWeek in the profile, any week with a session counts.
const DEFAULT_WEEKLY_TARGET = 1

export interface WeekProgress {
    // Its Monday.
    weekStart: string
    done: number
    target: number
}

export interface Streak {
    // Weeks in a row meeting their target, counting back from this one.
    weeks: number
    currentWeek: WeekProgress
    totalDays: number
}

// A week's target: the days per week of the plan that was active that week
// (the latest one if plans changed during it), or the profile's.
export const weeklyTarget = (weekStart: string, plans: Pick<Plan, 'startedOn' | 'closedOn' | 'daysPerWeek'>[], profileDaysPerWeek: number | null): number => {
    const weekEnd = addDays(weekStart, 6)
    const plan = plans
        .filter((p) => p.startedOn <= weekEnd && (p.closedOn === null || p.closedOn >= weekStart))
        .sort((a, b) => b.startedOn.localeCompare(a.startedOn))[0]
    return plan?.daysPerWeek ?? profileDaysPerWeek ?? DEFAULT_WEEKLY_TARGET
}

// The streak counts weeks, not days, so a rest day never breaks it. The
// current week only adds to it once its target is met, and doesn't break
// it while it is still going.
export const computeStreak = (sessionDates: string[], today: string, targetFor: (weekStart: string) => number): Streak => {
    const dates = sessionDates.filter((date) => date <= today)
    const perWeek = new Map<string, number>()
    for (const date of dates) {
        const week = mondayOf(date)
        perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
    }

    const thisWeek = mondayOf(today)
    const currentWeek = {weekStart: thisWeek, done: perWeek.get(thisWeek) ?? 0, target: targetFor(thisWeek)}
    let weeks = currentWeek.done >= currentWeek.target ? 1 : 0

    // No week before the first session can count: that is where it stops.
    const firstWeek = dates.reduce((first, date) => (mondayOf(date) < first ? mondayOf(date) : first), thisWeek)
    for (let week = addDays(thisWeek, -7); week >= firstWeek; week = addDays(week, -7)) {
        if ((perWeek.get(week) ?? 0) < targetFor(week)) break
        weeks++
    }

    return {weeks, currentWeek, totalDays: dates.length}
}
