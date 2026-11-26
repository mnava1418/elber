import { describe, expect, it } from 'vitest'
import CoachUseCase from '../../../../../../src/modules/chat/skills/training/application/coach.use-case.js'
import { DRAFT, fakeCoach, PLAN, READY } from '../fake-coach.js'

const TODAY = '2026-11-20'
const useCaseWith = (coach = fakeCoach()) => ({coach, useCase: new CoachUseCase(coach, '# Guide', () => TODAY)})

describe('CoachUseCase', () => {
    it('serves the guide', () => {
        expect(useCaseWith().useCase.guide()).toEqual({guide: '# Guide'})
    })

    it('gives the active and the ready plan, with the names of every exercise used before', async () => {
        const {coach, useCase} = useCaseWith()

        expect(await useCase.plans('uid-1')).toEqual({activePlan: PLAN, readyPlan: READY, knownExercises: ['Sentadilla trasera', 'Press de banca']})
        expect(coach.getProgress).toHaveBeenCalledWith('uid-1', TODAY)
    })

    it('leaves a new plan ready, prepared today, without starting it', async () => {
        const {coach, useCase} = useCaseWith()

        expect(await useCase.createPlan('uid-1', DRAFT)).toBe(READY)

        expect(coach.preparePlan).toHaveBeenCalledWith('uid-1', DRAFT, TODAY)
    })

    it('passes on why a plan was not saved', async () => {
        const coach = fakeCoach()
        coach.preparePlan.mockResolvedValue({error: 'INVALID_DATA', message: 'daysPerWeek must be an integer between 1 and 7'})

        expect(await useCaseWith(coach).useCase.createPlan('uid-1', DRAFT)).toMatchObject({error: 'INVALID_DATA'})
    })

    it('updates the ready plan or the active one, without the model knowing an id', async () => {
        const {coach, useCase} = useCaseWith()

        await useCase.updatePlan('uid-1', 'ready', DRAFT)
        await useCase.updatePlan('uid-1', 'active', DRAFT)

        expect(coach.updateReadyPlan).toHaveBeenCalledWith('uid-1', DRAFT)
        expect(coach.updatePlan).toHaveBeenCalledWith('uid-1', 'p1', DRAFT)
    })

    it('answers NO_ACTIVE_PLAN when there is no active plan to update', async () => {
        const coach = fakeCoach()
        coach.getActivePlan.mockResolvedValue(null)

        expect(await useCaseWith(coach).useCase.updatePlan('uid-1', 'active', DRAFT)).toEqual({error: 'NO_ACTIVE_PLAN'})
        expect(coach.updatePlan).not.toHaveBeenCalled()
    })
})
