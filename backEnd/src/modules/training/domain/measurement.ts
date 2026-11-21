import { addMonths } from './days.js'
import { checkDate, checkNumber, checkOptionalNumber } from './validation.js'

// The body measurements of a day. Only the weight is required: the rest
// depends on what the user can measure. Circumferences in cm, on the
// dominant side for arm and thigh.
export interface BodyMeasurement {
    id: string
    date: string
    weightKg: number
    bodyFatPct: number | null
    waistCm: number | null
    hipCm: number | null
    chestCm: number | null
    armCm: number | null
    thighCm: number | null
}

export type MeasurementDraft = Omit<BodyMeasurement, 'id'>

export const validateMeasurement = (draft: MeasurementDraft): MeasurementDraft => {
    checkDate('date', draft.date)
    checkNumber('weightKg', draft.weightKg, 20, 400)
    checkOptionalNumber('bodyFatPct', draft.bodyFatPct, 2, 70)
    for (const field of ['waistCm', 'hipCm', 'chestCm', 'armCm', 'thighCm'] as const) {
        checkOptionalNumber(field, draft[field], 10, 300)
    }
    return draft
}

// The page reminds the user to measure once a month. Nothing forces it: they
// can measure any day.
export const measurementDue = (lastDate: string | null, today: string): boolean =>
    lastDate === null || today >= addMonths(lastDate, 1)
