import { describe, expect, it } from 'vitest'
import { InvalidTrainingDataError } from '../../../../src/modules/training/domain/errors.js'
import { assignRoutineIds, plannedEndOf, validatePlanDraft } from '../../../../src/modules/training/domain/plan.js'
import { exercise, planDraft } from '../in-memory-training.js'

describe('validatePlanDraft', () => {
    it('accepts a valid plan', () => {
        expect(() => validatePlanDraft(planDraft())).not.toThrow()
    })

    it('rejects a plan without routines or a routine without exercises', () => {
        expect(() => validatePlanDraft(planDraft({routines: []}))).toThrow(InvalidTrainingDataError)
        expect(() => validatePlanDraft(planDraft({routines: [{name: 'Día A', exercises: []}]}))).toThrow(InvalidTrainingDataError)
    })

    it('names the field that breaks a rule', () => {
        const draft = planDraft({routines: [{name: 'Día A', exercises: [{...exercise('Sentadilla'), sets: 0}]}]})

        expect(() => validatePlanDraft(draft)).toThrow('routines[0].exercises[0].sets')
    })

    it('rejects impossible weeks', () => {
        expect(() => validatePlanDraft(planDraft({daysPerWeek: 8}))).toThrow(InvalidTrainingDataError)
        expect(() => validatePlanDraft(planDraft({durationWeeks: 0}))).toThrow(InvalidTrainingDataError)
    })
})

describe('assignRoutineIds', () => {
    const ids = () => {
        let n = 0
        return () => `new${++n}`
    }

    it('keeps the ids the plan already had and gives new ones to the rest', () => {
        const existing = [{id: 'a', name: 'Día A', exercises: []}]
        const routines = assignRoutineIds([{id: 'a', name: 'Día A (renombrado)', exercises: []}, {name: 'Día B', exercises: []}], existing, ids())

        expect(routines.map((r) => r.id)).toEqual(['a', 'new1'])
    })

    it("doesn't keep unknown or repeated ids", () => {
        const existing = [{id: 'a', name: 'Día A', exercises: []}]
        const routines = assignRoutineIds([{id: 'a', name: 'A', exercises: []}, {id: 'a', name: 'A2', exercises: []}, {id: 'zzz', name: 'B', exercises: []}], existing, ids())

        expect(routines.map((r) => r.id)).toEqual(['a', 'new1', 'new2'])
    })
})

describe('plannedEndOf', () => {
    it('is the last day of its last week', () => {
        expect(plannedEndOf({startedOn: '2026-11-16', durationWeeks: 4})).toBe('2026-12-13')
    })
})
