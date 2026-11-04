import { describe, expect, it } from 'vitest'
import { journalDay, weekdayOf } from '../../../src/shared/dates/journal-day.js'

describe('journalDay', () => {
    it('gives the local day and its name', () => {
        expect(journalDay(new Date(2026, 10, 2, 21, 15))).toEqual({date: '2026-11-02', title: 'lunes 2 de noviembre'})
    })

    it('still counts the small hours as the day before, until 4:00', () => {
        expect(journalDay(new Date(2026, 10, 3, 0, 30)).date).toBe('2026-11-02')
        expect(journalDay(new Date(2026, 10, 3, 3, 59)).date).toBe('2026-11-02')
        expect(journalDay(new Date(2026, 10, 3, 4, 0)).date).toBe('2026-11-03')
    })

    it('goes back across months', () => {
        expect(journalDay(new Date(2026, 11, 1, 1, 0)).date).toBe('2026-11-30')
    })
})

describe('weekdayOf', () => {
    it('names the weekday of a date', () => {
        expect(weekdayOf('2026-11-02')).toBe('lunes')
    })
})
