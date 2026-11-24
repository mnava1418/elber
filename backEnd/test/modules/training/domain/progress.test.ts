import { describe, expect, it } from 'vitest'
import type { Plan } from '../../../../src/modules/training/domain/plan.js'
import { exerciseKey, exerciseSeries } from '../../../../src/modules/training/domain/progress.js'
import { exercise } from '../in-memory-training.js'

const plan = (id: string, startedOn: string, exercises: Plan['routines'][number]['exercises'][]): Plan => ({
    id, name: `Plan ${id}`, goal: null, notes: null, status: 'closed', startedOn, durationWeeks: 4, daysPerWeek: 3, closedOn: null,
    routines: exercises.map((list, i) => ({id: `r${i}`, name: `Día ${i}`, exercises: list})),
})

describe('exerciseKey', () => {
    it('ignores case, accents and extra spaces', () => {
        expect(exerciseKey('  Press  de Banca ')).toBe(exerciseKey('press de banca'))
        expect(exerciseKey('Jalón al pecho')).toBe('jalon al pecho')
    })
})

describe('exerciseSeries', () => {
    it('follows each exercise from plan to plan, oldest first, named as the newest plan does', () => {
        const plans = [
            plan('b', '2026-11-01', [[exercise('Sentadilla Trasera', 70)]]),
            plan('a', '2026-10-01', [[exercise('sentadilla trasera', 60), exercise('Dominadas')]]),
        ]

        expect(exerciseSeries(plans)).toEqual([
            {key: 'dominadas', name: 'Dominadas', points: [expect.objectContaining({planId: 'a', weightKg: null})]},
            {key: 'sentadilla trasera', name: 'Sentadilla Trasera', points: [
                expect.objectContaining({planId: 'a', startedOn: '2026-10-01', weightKg: 60}),
                expect.objectContaining({planId: 'b', startedOn: '2026-11-01', weightKg: 70}),
            ]},
        ])
    })

    it('takes the heaviest when a plan has the exercise in more than one routine', () => {
        const plans = [plan('a', '2026-10-01', [[exercise('Peso muerto', 80)], [exercise('Peso muerto', 100)]])]

        expect(exerciseSeries(plans)[0]?.points).toEqual([expect.objectContaining({weightKg: 100})])
    })
})
