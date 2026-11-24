import { describe, expect, it } from 'vitest'
import { computeStreak, weeklyTarget } from '../../../../src/modules/training/domain/streak.js'

// Weeks of November 2026 start on 2, 9, 16 and 23. Today is Friday 20.
const TODAY = '2026-11-20'
const three = () => 3

describe('computeStreak', () => {
    it('is zero without sessions', () => {
        expect(computeStreak([], TODAY, three)).toEqual({weeks: 0, currentWeek: {weekStart: '2026-11-16', done: 0, target: 3}, totalDays: 0})
    })

    it('counts past weeks that met their target, and the current one does not break it', () => {
        const dates = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-17']

        const streak = computeStreak(dates, TODAY, three)

        expect(streak.weeks).toBe(2)
        expect(streak.currentWeek).toEqual({weekStart: '2026-11-16', done: 1, target: 3})
        expect(streak.totalDays).toBe(7)
    })

    it('adds the current week once its target is met', () => {
        const dates = ['2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16', '2026-11-18', '2026-11-20']

        expect(computeStreak(dates, TODAY, three).weeks).toBe(2)
    })

    it('stops at the first past week that missed its target', () => {
        const dates = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-17', '2026-11-18']

        expect(computeStreak(dates, TODAY, three).weeks).toBe(1)
    })

    it('uses each week its own target', () => {
        const dates = ['2026-11-02', '2026-11-03', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']
        const target = (week: string) => (week < '2026-11-09' ? 2 : 4)

        expect(computeStreak(dates, TODAY, target).weeks).toBe(2)
    })

    it('ignores days after today', () => {
        expect(computeStreak(['2026-11-25'], TODAY, three).totalDays).toBe(0)
    })
})

describe('weeklyTarget', () => {
    const plans = [
        {startedOn: '2026-10-01', closedOn: '2026-11-04', daysPerWeek: 3},
        {startedOn: '2026-11-05', closedOn: null, daysPerWeek: 4},
    ]

    it('is the days per week of the plan active that week', () => {
        expect(weeklyTarget('2026-10-12', plans, 2)).toBe(3)
        expect(weeklyTarget('2026-11-16', plans, 2)).toBe(4)
    })

    it('uses the newest plan when they changed during the week', () => {
        expect(weeklyTarget('2026-11-02', plans, 2)).toBe(4)
    })

    it('uses the active plan when another one started and closed the same day', () => {
        const sameDay = [{startedOn: '2026-11-23', closedOn: null, daysPerWeek: 6}, {startedOn: '2026-11-23', closedOn: '2026-11-23', daysPerWeek: 4}]
        expect(weeklyTarget('2026-11-23', sameDay, 2)).toBe(6)
        expect(weeklyTarget('2026-11-23', [...sameDay].reverse(), 2)).toBe(6)
    })

    it("falls back to the profile's, and then to one day", () => {
        expect(weeklyTarget('2026-09-07', plans, 2)).toBe(2)
        expect(weeklyTarget('2026-09-07', plans, null)).toBe(1)
    })
})
