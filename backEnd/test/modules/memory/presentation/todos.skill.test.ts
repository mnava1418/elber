import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { SkillContext } from '../../../../src/shared/skills/skill.js'
import type ManageTodosUseCase from '../../../../src/modules/memory/application/manage-todos.use-case.js'
import { buildAddTodoTool, buildCompleteTodoTool, buildListTodosTool } from '../../../../src/modules/memory/presentation/todos.skill.js'

const context: SkillContext = {
    uid: 'owner-uid',
    signal: new AbortController().signal,
    locate: async () => null,
    show: () => {},
}

const manageTodos = () => ({
    add: vi.fn<ManageTodosUseCase['add']>(async () => ({added: true})),
    complete: vi.fn<ManageTodosUseCase['complete']>(async () => ({completed: true})),
    list: vi.fn<ManageTodosUseCase['list']>(async () => ({todos: []})),
})

const asUseCase = (useCase: ReturnType<typeof manageTodos>) => useCase as unknown as ManageTodosUseCase

describe('add_todo tool', () => {
    it('adds the task for the user asking and gives the result to the model', async () => {
        const useCase = manageTodos()

        const result = await buildAddTodoTool(asUseCase(useCase)).run({task: 'Hablarle a mi familia', due: '2026-10-31'}, context)

        expect(useCase.add).toHaveBeenCalledExactlyOnceWith({task: 'Hablarle a mi familia', due: '2026-10-31'}, 'owner-uid')
        expect(result).toEqual({added: true})
    })

    it('adds a task without a date', async () => {
        const useCase = manageTodos()

        await buildAddTodoTool(asUseCase(useCase)).run({task: 'Renovar el pasaporte'}, context)

        expect(useCase.add).toHaveBeenCalledExactlyOnceWith({task: 'Renovar el pasaporte', due: null}, 'owner-uid')
    })

    it('rejects a blank task or a date that is not YYYY-MM-DD', () => {
        const input = z.object(buildAddTodoTool(asUseCase(manageTodos())).input)

        expect(input.safeParse({task: '   '}).success).toBe(false)
        expect(input.safeParse({task: 'Algo', due: 'el sábado'}).success).toBe(false)
        expect(input.parse({task: ' Algo ', due: '2026-10-31'})).toEqual({task: 'Algo', due: '2026-10-31'})
    })
})

describe('complete_todo tool', () => {
    it('ticks the task for the user asking and gives the result to the model', async () => {
        const useCase = manageTodos()

        const result = await buildCompleteTodoTool(asUseCase(useCase)).run({task: 'Hablarle a mi familia'}, context)

        expect(useCase.complete).toHaveBeenCalledExactlyOnceWith({task: 'Hablarle a mi familia'}, 'owner-uid')
        expect(result).toEqual({completed: true})
    })
})

describe('list_todos tool', () => {
    it("lists the pending tasks of the user asking", async () => {
        const useCase = manageTodos()

        const result = await buildListTodosTool(asUseCase(useCase)).run({}, context)

        expect(useCase.list).toHaveBeenCalledExactlyOnceWith('owner-uid')
        expect(result).toEqual({todos: []})
    })
})
