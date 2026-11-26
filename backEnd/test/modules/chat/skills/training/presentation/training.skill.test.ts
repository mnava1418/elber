import { describe, expect, it, vi } from 'vitest'
import type { SkillContext, SkillTool } from '../../../../../../src/modules/chat/domain/skill.js'
import CoachUseCase from '../../../../../../src/modules/chat/skills/training/application/coach.use-case.js'
import { buildTrainingTools } from '../../../../../../src/modules/chat/skills/training/presentation/training.skill.js'
import { fakeCoach, PLAN, READY } from '../fake-coach.js'

const context = (): SkillContext => ({
    uid: 'uid-1',
    conversationId: 'conv1',
    signal: new AbortController().signal,
    locate: async () => null,
    show: vi.fn(),
})

const setup = () => {
    const coach = fakeCoach()
    const tools = buildTrainingTools(new CoachUseCase(coach, '# Guide', () => '2026-11-20'))
    const tool = (name: string): SkillTool => tools.find((t) => t.name === name)!
    return {coach, tools, tool}
}

// What the model sends: optional fields left out.
const INPUT = {
    name: 'Fuerza base', durationWeeks: 4, daysPerWeek: 3,
    routines: [{name: 'Día A: Pierna', exercises: [{name: 'Dominadas', sets: 3, reps: 'al fallo'}]}],
}

describe('training tools', () => {
    it('offers the coach tools, and none to close plans or mark days', () => {
        expect(setup().tools.map((t) => t.name)).toEqual([
            'get_coaching_guide', 'get_training_profile', 'update_training_profile',
            'get_plans', 'create_plan', 'update_plan', 'get_training_progress',
        ])
    })

    it('create_plan leaves the plan ready, fills in what the model left out and shows it as a ready card', async () => {
        const {coach, tool} = setup()
        const ctx = context()

        const result = await tool('create_plan').run(INPUT, ctx)

        expect(coach.preparePlan).toHaveBeenCalledWith('uid-1', {
            ...INPUT, goal: null, notes: null,
            routines: [{name: 'Día A: Pierna', exercises: [{name: 'Dominadas', sets: 3, reps: 'al fallo', weightKg: null, restSeconds: null, notes: null}]}],
        }, '2026-11-20')
        expect(result).toBe(READY)
        expect(ctx.show).toHaveBeenCalledExactlyOnceWith({type: 'training_plan', data: {status: 'ready', ...READY}})
    })

    it('update_plan changes the plan it is told, keeping the ids of the routines that stay', async () => {
        const {coach, tool} = setup()
        const ctx = context()

        await tool('update_plan').run({which: 'active', ...INPUT, routines: [{...INPUT.routines[0]!, id: 'a'}]}, ctx)
        await tool('update_plan').run({which: 'ready', ...INPUT}, context())

        expect(coach.updatePlan.mock.calls[0]?.[2].routines[0]).toMatchObject({id: 'a'})
        expect(coach.updateReadyPlan).toHaveBeenCalledOnce()
        expect(ctx.show).toHaveBeenCalledExactlyOnceWith({type: 'training_plan', data: PLAN})
    })

    it('shows no card when the plan was not saved', async () => {
        const {coach, tool} = setup()
        coach.preparePlan.mockResolvedValue({error: 'INVALID_DATA', message: 'daysPerWeek must be an integer between 1 and 7'})
        const ctx = context()

        const result = await tool('create_plan').run(INPUT, ctx)

        expect(result).toEqual({error: 'INVALID_DATA', message: 'daysPerWeek must be an integer between 1 and 7'})
        expect(ctx.show).not.toHaveBeenCalled()
    })

    it('update_training_profile sends only the fields the model gave, null included', async () => {
        const {coach, tool} = setup()

        await tool('update_training_profile').run({daysPerWeek: 4, injuries: null}, context())

        expect(coach.updateProfile).toHaveBeenCalledWith('uid-1', {daysPerWeek: 4, injuries: null})
    })

    it('get_plans shows the plan the user asked to see as a card, and none when only reading', async () => {
        const {coach, tool} = setup()
        const active = context()
        const ready = context()
        const read = context()

        await tool('get_plans').run({show: 'active'}, active)
        await tool('get_plans').run({show: 'ready'}, ready)
        await tool('get_plans').run({}, read)
        coach.getReadyPlan.mockResolvedValue(null)
        await tool('get_plans').run({show: 'ready'}, read)

        expect(active.show).toHaveBeenCalledExactlyOnceWith({type: 'training_plan', data: PLAN})
        expect(ready.show).toHaveBeenCalledExactlyOnceWith({type: 'training_plan', data: {status: 'ready', ...READY}})
        expect(read.show).not.toHaveBeenCalled()
    })

    it('get_coaching_guide serves the guide', async () => {
        expect(await setup().tool('get_coaching_guide').run({}, context())).toEqual({guide: '# Guide'})
    })
})
