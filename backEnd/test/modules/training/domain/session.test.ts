import { describe, expect, it } from 'vitest'
import { nextRoutine, type TrainingSession } from '../../../../src/modules/training/domain/session.js'

const plan = {
    id: 'p1',
    routines: [
        {id: 'a', name: 'Día A', exercises: []},
        {id: 'b', name: 'Día B', exercises: []},
        {id: 'c', name: 'Día C', exercises: []},
    ],
}

const session = (date: string, routineId: string | null, planId: string | null = 'p1'): TrainingSession =>
    ({date, planId, routineId, routineName: null})

describe('nextRoutine', () => {
    it('starts with the first routine', () => {
        expect(nextRoutine(plan, [])?.id).toBe('a')
    })

    it('follows the last routine done, wrapping around', () => {
        expect(nextRoutine(plan, [session('2026-11-16', 'a'), session('2026-11-18', 'b')])?.id).toBe('c')
        expect(nextRoutine(plan, [session('2026-11-20', 'c')])?.id).toBe('a')
    })

    it('goes by date, not by the order of the list', () => {
        expect(nextRoutine(plan, [session('2026-11-18', 'b'), session('2026-11-16', 'a')])?.id).toBe('c')
    })

    it('ignores days without a routine and sessions of other plans', () => {
        expect(nextRoutine(plan, [session('2026-11-16', 'a'), session('2026-11-17', null), session('2026-11-18', 'b', 'old')])?.id).toBe('b')
    })

    it('restarts if the last routine was removed from the plan', () => {
        expect(nextRoutine(plan, [session('2026-11-16', 'gone')])?.id).toBe('a')
    })
})
