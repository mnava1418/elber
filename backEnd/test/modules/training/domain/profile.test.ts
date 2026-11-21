import { describe, expect, it } from 'vitest'
import { InvalidTrainingDataError } from '../../../../src/modules/training/domain/errors.js'
import { applyProfileChanges, EMPTY_PROFILE } from '../../../../src/modules/training/domain/profile.js'

describe('applyProfileChanges', () => {
    it('changes only the given fields, and null clears one', () => {
        const profile = applyProfileChanges({...EMPTY_PROFILE, goal: 'Fuerza', heightCm: 175}, {daysPerWeek: 4, goal: null})

        expect(profile).toEqual({...EMPTY_PROFILE, heightCm: 175, daysPerWeek: 4})
    })

    it('ignores keys that are not in the profile', () => {
        const profile = applyProfileChanges(EMPTY_PROFILE, {level: 'beginner', ...{admin: true}} as never)

        expect(profile).toEqual({...EMPTY_PROFILE, level: 'beginner'})
    })

    it('rejects values that break a rule', () => {
        expect(() => applyProfileChanges(EMPTY_PROFILE, {daysPerWeek: 8})).toThrow(InvalidTrainingDataError)
        expect(() => applyProfileChanges(EMPTY_PROFILE, {daysPerWeek: 2.5})).toThrow(InvalidTrainingDataError)
        expect(() => applyProfileChanges(EMPTY_PROFILE, {level: 'pro' as never})).toThrow(InvalidTrainingDataError)
        expect(() => applyProfileChanges(EMPTY_PROFILE, {goal: '   '})).toThrow(InvalidTrainingDataError)
    })
})
