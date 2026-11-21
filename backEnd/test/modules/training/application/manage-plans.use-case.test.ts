import { beforeEach, describe, expect, it } from 'vitest'
import ManagePlansUseCase from '../../../../src/modules/training/application/manage-plans.use-case.js'
import { InvalidTrainingDataError, PlanAlreadyActiveError, PlanClosedError, PlanNotFoundError } from '../../../../src/modules/training/domain/errors.js'
import { InMemoryPlans, planDraft } from '../in-memory-training.js'

describe('ManagePlansUseCase', () => {
    let plans: InMemoryPlans
    let useCase: ManagePlansUseCase

    beforeEach(() => {
        plans = new InMemoryPlans()
        let n = 0
        useCase = new ManagePlansUseCase(plans, () => `r${++n}`)
    })

    describe('create', () => {
        it('starts an active plan with ids for its routines', async () => {
            const plan = await useCase.create('uid-1', planDraft(), '2026-11-20')

            expect(plan).toMatchObject({name: 'Fuerza base', status: 'active', startedOn: '2026-11-20', closedOn: null})
            expect(plan.routines.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
            expect(await useCase.getActive('uid-1')).toEqual(plan)
        })

        it('refuses a second active plan', async () => {
            await useCase.create('uid-1', planDraft(), '2026-11-20')

            await expect(useCase.create('uid-1', planDraft(), '2026-11-20')).rejects.toThrow(PlanAlreadyActiveError)
        })

        it("doesn't mind someone else's active plan", async () => {
            await useCase.create('someone-else', planDraft(), '2026-11-20')

            await expect(useCase.create('uid-1', planDraft(), '2026-11-20')).resolves.toBeDefined()
        })

        it('rejects an invalid plan or date, saving nothing', async () => {
            await expect(useCase.create('uid-1', planDraft({routines: []}), '2026-11-20')).rejects.toThrow(InvalidTrainingDataError)
            await expect(useCase.create('uid-1', planDraft(), 'hoy')).rejects.toThrow(InvalidTrainingDataError)
            expect(plans.plans.size).toBe(0)
        })
    })

    describe('update', () => {
        it('replaces what the plan says and keeps its status, dates and routine ids', async () => {
            const plan = await useCase.create('uid-1', planDraft(), '2026-11-20')
            const [a, b] = plan.routines

            const updated = await useCase.update('uid-1', plan.id, planDraft({
                name: 'Fuerza base v2',
                routines: [{...b!}, {...a!, name: 'Día A: Pierna pesada'}, {name: 'Día D: Core', exercises: a!.exercises}],
            }))

            expect(updated).toMatchObject({id: plan.id, name: 'Fuerza base v2', status: 'active', startedOn: '2026-11-20'})
            expect(updated.routines.map((r) => r.id)).toEqual([b!.id, a!.id, 'r4'])
            expect(await useCase.get('uid-1', plan.id)).toEqual(updated)
        })

        it("refuses a closed plan and someone else's", async () => {
            const plan = await useCase.create('uid-1', planDraft(), '2026-11-01')
            await useCase.close('uid-1', plan.id, '2026-11-20')

            await expect(useCase.update('uid-1', plan.id, planDraft())).rejects.toThrow(PlanClosedError)
            await expect(useCase.update('uid-2', plan.id, planDraft())).rejects.toThrow(PlanNotFoundError)
        })
    })

    describe('close', () => {
        it('moves the plan to the history and frees the way for a new one', async () => {
            const plan = await useCase.create('uid-1', planDraft(), '2026-11-01')

            const closed = await useCase.close('uid-1', plan.id, '2026-11-20')

            expect(closed).toMatchObject({status: 'closed', closedOn: '2026-11-20'})
            expect(await useCase.getActive('uid-1')).toBeNull()
            await expect(useCase.create('uid-1', planDraft(), '2026-11-20')).resolves.toBeDefined()
            expect((await useCase.list('uid-1')).map((p) => p.status)).toEqual(['active', 'closed'])
        })

        it('refuses to close it twice or before it started', async () => {
            const plan = await useCase.create('uid-1', planDraft(), '2026-11-10')

            await expect(useCase.close('uid-1', plan.id, '2026-11-09')).rejects.toThrow(InvalidTrainingDataError)
            await useCase.close('uid-1', plan.id, '2026-11-20')
            await expect(useCase.close('uid-1', plan.id, '2026-11-20')).rejects.toThrow(PlanClosedError)
        })
    })
})
