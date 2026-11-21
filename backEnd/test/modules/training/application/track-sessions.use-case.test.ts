import { beforeEach, describe, expect, it } from 'vitest'
import ManagePlansUseCase from '../../../../src/modules/training/application/manage-plans.use-case.js'
import TrackSessionsUseCase from '../../../../src/modules/training/application/track-sessions.use-case.js'
import { InvalidTrainingDataError, RoutineNotFoundError, SessionNotFoundError } from '../../../../src/modules/training/domain/errors.js'
import { InMemoryPlans, InMemorySessions, planDraft } from '../in-memory-training.js'

const TODAY = '2026-11-20'

describe('TrackSessionsUseCase', () => {
    let sessions: InMemorySessions
    let plans: ManagePlansUseCase
    let useCase: TrackSessionsUseCase

    beforeEach(() => {
        sessions = new InMemorySessions()
        const planRepository = new InMemoryPlans()
        plans = new ManagePlansUseCase(planRepository, () => 'a')
        useCase = new TrackSessionsUseCase(sessions, planRepository)
    })

    it('marks a day with a routine of the active plan', async () => {
        const plan = await plans.create('uid-1', planDraft({routines: [planDraft().routines[0]!]}), '2026-11-16')

        const session = await useCase.mark('uid-1', {date: TODAY, routineId: 'a', today: TODAY})

        expect(session).toEqual({date: TODAY, planId: plan.id, routineId: 'a', routineName: 'Día A: Pierna'})
        expect(await useCase.list('uid-1')).toEqual([session])
    })

    it('marks a day without a plan', async () => {
        expect(await useCase.mark('uid-1', {date: TODAY, routineId: null, today: TODAY}))
            .toEqual({date: TODAY, planId: null, routineId: null, routineName: null})
    })

    it('replaces the session when the day is marked again', async () => {
        await plans.create('uid-1', planDraft({routines: [planDraft().routines[0]!]}), '2026-11-16')
        await useCase.mark('uid-1', {date: TODAY, routineId: 'a', today: TODAY})

        await useCase.mark('uid-1', {date: TODAY, routineId: null, today: TODAY})

        expect(await useCase.list('uid-1')).toEqual([expect.objectContaining({routineId: null})])
    })

    it('refuses future days and routines that are not in the active plan', async () => {
        await expect(useCase.mark('uid-1', {date: '2026-11-21', routineId: null, today: TODAY})).rejects.toThrow(InvalidTrainingDataError)
        await expect(useCase.mark('uid-1', {date: TODAY, routineId: 'zzz', today: TODAY})).rejects.toThrow(RoutineNotFoundError)
        expect(sessions.sessions.size).toBe(0)
    })

    it('unmarks a day, and fails if it was not marked', async () => {
        await useCase.mark('uid-1', {date: TODAY, routineId: null, today: TODAY})

        await useCase.unmark('uid-1', TODAY)

        expect(await useCase.list('uid-1')).toEqual([])
        await expect(useCase.unmark('uid-1', TODAY)).rejects.toThrow(SessionNotFoundError)
    })

    it('lists a range, and only the user\'s days', async () => {
        for (const date of ['2026-11-10', '2026-11-15', TODAY]) await useCase.mark('uid-1', {date, routineId: null, today: TODAY})
        await useCase.mark('uid-2', {date: '2026-11-15', routineId: null, today: TODAY})

        expect((await useCase.list('uid-1', {from: '2026-11-11', to: '2026-11-19'})).map((s) => s.date)).toEqual(['2026-11-15'])
    })
})
