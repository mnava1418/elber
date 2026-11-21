import { describe, expect, it } from 'vitest'
import { InvalidTrainingDataError } from '../../../../src/modules/training/domain/errors.js'
import { measurementDue, validateMeasurement, type MeasurementDraft } from '../../../../src/modules/training/domain/measurement.js'

const draft = (changes: Partial<MeasurementDraft> = {}): MeasurementDraft => ({
    date: '2026-11-20', weightKg: 80, bodyFatPct: null, waistCm: 85, hipCm: null, chestCm: null, armCm: null, thighCm: null, ...changes,
})

describe('validateMeasurement', () => {
    it('only requires the date and the weight', () => {
        expect(() => validateMeasurement(draft({waistCm: null}))).not.toThrow()
    })

    it('rejects impossible values', () => {
        expect(() => validateMeasurement(draft({weightKg: 0}))).toThrow(InvalidTrainingDataError)
        expect(() => validateMeasurement(draft({bodyFatPct: 90}))).toThrow(InvalidTrainingDataError)
        expect(() => validateMeasurement(draft({date: '2026-11-31'}))).toThrow(InvalidTrainingDataError)
    })
})

describe('measurementDue', () => {
    it('is due without measurements, and a month after the last one', () => {
        expect(measurementDue(null, '2026-11-20')).toBe(true)
        expect(measurementDue('2026-10-21', '2026-11-20')).toBe(false)
        expect(measurementDue('2026-10-20', '2026-11-20')).toBe(true)
    })
})
