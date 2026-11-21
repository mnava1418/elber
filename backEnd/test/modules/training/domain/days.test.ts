import { describe, expect, it } from 'vitest'
import { addDays, addMonths, isIsoDate, mondayOf } from '../../../../src/modules/training/domain/days.js'

describe('isIsoDate', () => {
    it('accepts real days as YYYY-MM-DD', () => {
        expect(isIsoDate('2026-11-20')).toBe(true)
        expect(isIsoDate('2028-02-29')).toBe(true)
    })

    it('rejects other shapes and days that do not exist', () => {
        expect(isIsoDate('2026-11-20T10:00')).toBe(false)
        expect(isIsoDate('20/11/2026')).toBe(false)
        expect(isIsoDate('2026-02-30')).toBe(false)
        expect(isIsoDate('2026-13-01')).toBe(false)
    })
})

describe('addDays', () => {
    it('crosses months and years', () => {
        expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
        expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    })
})

describe('addMonths', () => {
    it('keeps the day, or uses the last day of a shorter month', () => {
        expect(addMonths('2026-11-20', 1)).toBe('2026-12-20')
        expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
        expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    })
})

describe('mondayOf', () => {
    it('gives the Monday of the week', () => {
        expect(mondayOf('2026-11-20')).toBe('2026-11-16') // Friday
        expect(mondayOf('2026-11-16')).toBe('2026-11-16') // Monday
        expect(mondayOf('2026-11-22')).toBe('2026-11-16') // Sunday
    })
})
