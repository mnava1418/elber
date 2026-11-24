import { isIsoDate } from './days.js'
import { InvalidTrainingDataError } from './errors.js'

// Small checks shared by the domain's validators. Each throws
// InvalidTrainingDataError naming the field, so the model or the page can
// fix exactly that.

export const MAX_TEXT_LENGTH = 500
export const MAX_NAME_LENGTH = 80

export const checkNumber = (field: string, value: number, min: number, max: number, integer = false) => {
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
        throw new InvalidTrainingDataError(`${field} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`)
    }
}

export const checkOptionalNumber = (field: string, value: number | null, min: number, max: number, integer = false) => {
    if (value !== null) checkNumber(field, value, min, max, integer)
}

export const checkText = (field: string, value: string, maxLength: number) => {
    if (value.trim() === '') throw new InvalidTrainingDataError(`${field} can't be empty`)
    if (value.length > maxLength) throw new InvalidTrainingDataError(`${field} must be at most ${maxLength} characters`)
}

export const checkOptionalText = (field: string, value: string | null, maxLength = MAX_TEXT_LENGTH) => {
    if (value !== null) checkText(field, value, maxLength)
}

export const checkDate = (field: string, value: string) => {
    if (!isIsoDate(value)) throw new InvalidTrainingDataError(`${field} must be a date as YYYY-MM-DD`)
}
