import { describe, expect, it } from 'vitest'
import CoachUseCase from '../../../../../../src/modules/chat/skills/training/application/coach.use-case.js'
import { DRAFT, fakeCoach, PLAN } from '../fake-coach.js'

const TODAY = '2026-11-20'
const useCaseWith = (coach = fakeCoach()) => ({coach, useCase: new CoachUseCase(coach, '# Guide', () => TODAY)})

describe('CoachUseCase', () => {
    it('serves the guide', () => {
        expect(useCaseWith().useCase.guide()).toEqual({guide: '# Guide'})
    })

    it('gives the active plan with the names of every exercise used before', async () => {
        const {coach, useCase} = useCaseWith()

        expect(await useCase.activePlan('uid-1')).toEqual({plan: PLAN, knownExercises: ['Sentadilla trasera', 'Press de banca']})
        expect(coach.getProgress).toHaveBeenCalledWith('uid-1', TODAY)
    })

    it('starts a new plan today', async () => {
        const {coach, useCase} = useCaseWith()

        await useCase.createPlan('uid-1', DRAFT)

        expect(coach.createPlan).toHaveBeenCalledWith('uid-1', DRAFT, TODAY)
    })

    it('passes on why a plan was not saved', async () => {
        const coach = fakeCoach()
        coach.createPlan.mockResolvedValue({error: 'PLAN_ALREADY_ACTIVE'})

        expect(await useCaseWith(coach).useCase.createPlan('uid-1', DRAFT)).toEqual({error: 'PLAN_ALREADY_ACTIVE'})
    })

    it('updates the active plan, without the model knowing its id', async () => {
        const {coach, useCase} = useCaseWith()

        await useCase.updatePlan('uid-1', DRAFT)

        expect(coach.updatePlan).toHaveBeenCalledWith('uid-1', 'p1', DRAFT)
    })

    it('answers NO_ACTIVE_PLAN when there is nothing to update', async () => {
        const coach = fakeCoach()
        coach.getActivePlan.mockResolvedValue(null)

        expect(await useCaseWith(coach).useCase.updatePlan('uid-1', DRAFT)).toEqual({error: 'NO_ACTIVE_PLAN'})
        expect(coach.updatePlan).not.toHaveBeenCalled()
    })
})
