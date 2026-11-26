import { beforeEach, describe, expect, it } from 'vitest'
import ManageReadyPlanUseCase from '../../../../src/modules/training/application/manage-ready-plan.use-case.js'
import { InvalidTrainingDataError, PlanAlreadyActiveError, ReadyPlanNotFoundError } from '../../../../src/modules/training/domain/errors.js'
import { InMemoryPlans, InMemoryReadyPlans, planDraft } from '../in-memory-training.js'

const TODAY = '2026-11-23'

describe('ManageReadyPlanUseCase', () => {
    let plans: InMemoryPlans
    let ready: InMemoryReadyPlans
    let useCase: ManageReadyPlanUseCase

    beforeEach(() => {
        plans = new InMemoryPlans()
        ready = new InMemoryReadyPlans()
        let n = 0
        useCase = new ManageReadyPlanUseCase(ready, plans, () => `r${++n}`)
    })

    it('prepares a plan without dates or an active status', async () => {
        const prepared = await useCase.prepare('uid-1', planDraft(), '2026-11-20')

        expect(prepared).toMatchObject({name: planDraft().name, preparedOn: '2026-11-20'})
        expect(prepared.routines.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
        expect(await plans.findActive('uid-1')).toBeNull()
    })

    it('replaces the plan that was ready', async () => {
        await useCase.prepare('uid-1', planDraft(), '2026-11-20')
        await useCase.prepare('uid-1', planDraft({name: 'Otro'}), '2026-11-21')

        expect((await useCase.get('uid-1'))?.name).toBe('Otro')
    })

    it('rejects a plan that breaks a rule', async () => {
        await expect(useCase.prepare('uid-1', planDraft({daysPerWeek: 9}), '2026-11-20')).rejects.toBeInstanceOf(InvalidTrainingDataError)
    })

    it('edits it keeping the routines that stay and the day it was prepared', async () => {
        const prepared = await useCase.prepare('uid-1', planDraft(), '2026-11-20')
        const [a, , c] = prepared.routines

        const updated = await useCase.update('uid-1', {...planDraft(), routines: [{...c!}, {...a!}]})

        expect(updated.routines.map((r) => r.id)).toEqual([c!.id, a!.id])
        expect(updated.preparedOn).toBe('2026-11-20')
    })

    it('starts it today with its routine ids, and it stops being ready', async () => {
        const prepared = await useCase.prepare('uid-1', planDraft(), '2026-11-20')

        const plan = await useCase.start('uid-1', TODAY, false)

        expect(plan).toMatchObject({status: 'active', startedOn: TODAY, closedOn: null, routines: prepared.routines})
        expect(plan).not.toHaveProperty('preparedOn')
        expect(await useCase.get('uid-1')).toBeNull()
    })

    it('only closes the active plan when the user agreed', async () => {
        const old = await plans.create('uid-1', {...planDraft(), status: 'active', startedOn: '2026-11-02', closedOn: null, routines: []})
        await useCase.prepare('uid-1', planDraft(), '2026-11-20')

        await expect(useCase.start('uid-1', TODAY, false)).rejects.toBeInstanceOf(PlanAlreadyActiveError)
        await useCase.start('uid-1', TODAY, true)

        expect(await plans.find('uid-1', old.id)).toMatchObject({status: 'closed', closedOn: TODAY})
        expect((await plans.findActive('uid-1'))?.startedOn).toBe(TODAY)
    })

    it('answers ReadyPlanNotFoundError when there is none', async () => {
        await expect(useCase.start('uid-1', TODAY, false)).rejects.toBeInstanceOf(ReadyPlanNotFoundError)
        await expect(useCase.update('uid-1', planDraft())).rejects.toBeInstanceOf(ReadyPlanNotFoundError)
        await expect(useCase.discard('uid-1')).rejects.toBeInstanceOf(ReadyPlanNotFoundError)
    })

    it('discards it', async () => {
        await useCase.prepare('uid-1', planDraft(), '2026-11-20')

        await useCase.discard('uid-1')

        expect(await useCase.get('uid-1')).toBeNull()
    })
})
