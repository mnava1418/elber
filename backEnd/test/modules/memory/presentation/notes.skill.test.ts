import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { SkillContext } from '../../../../src/shared/skills/skill.js'
import type ManageNotesUseCase from '../../../../src/modules/memory/application/manage-notes.use-case.js'
import { buildLinkNotesTool, buildReadNoteTool, buildSaveNoteTool, buildSearchNotesTool, buildUpdateNoteTool } from '../../../../src/modules/memory/presentation/notes.skill.js'

const context: SkillContext = {
    uid: 'owner-uid',
    signal: new AbortController().signal,
    locate: async () => null,
    show: () => {},
}

const manageNotes = () => ({
    save: vi.fn<ManageNotesUseCase['save']>(async () => ({saved: true, title: 'Skill de finanzas'})),
    search: vi.fn<ManageNotesUseCase['search']>(async () => ({notes: []})),
    read: vi.fn<ManageNotesUseCase['read']>(async () => ({error: 'NOT_FOUND'})),
    update: vi.fn<ManageNotesUseCase['update']>(async () => ({updated: true})),
    link: vi.fn<ManageNotesUseCase['link']>(async () => ({linked: true})),
})

const asUseCase = (useCase: ReturnType<typeof manageNotes>) => useCase as unknown as ManageNotesUseCase

describe('save_note tool', () => {
    it('saves the note for the user asking and gives the result to the model', async () => {
        const useCase = manageNotes()
        const input = {title: 'Skill de finanzas', type: 'idea' as const, tags: ['elber'], content: 'Leer los estados de cuenta.'}

        const result = await buildSaveNoteTool(asUseCase(useCase)).run(input, context)

        expect(useCase.save).toHaveBeenCalledExactlyOnceWith(input, 'owner-uid')
        expect(result).toEqual({saved: true, title: 'Skill de finanzas'})
    })

    it('saves a note without tags', async () => {
        const useCase = manageNotes()

        await buildSaveNoteTool(asUseCase(useCase)).run({title: 'Algo', type: 'nota', content: 'Texto'}, context)

        expect(useCase.save).toHaveBeenCalledExactlyOnceWith({title: 'Algo', type: 'nota', tags: [], content: 'Texto'}, 'owner-uid')
    })

    it('rejects an unknown type or an empty note', () => {
        const input = z.object(buildSaveNoteTool(asUseCase(manageNotes())).input)

        expect(input.safeParse({title: 'Algo', type: 'toDo', content: 'Texto'}).success).toBe(false)
        expect(input.safeParse({title: 'Algo', type: 'idea', content: '  '}).success).toBe(false)
    })
})

describe('search_notes tool', () => {
    it('searches the notes of the user asking', async () => {
        const useCase = manageNotes()

        expect(await buildSearchNotesTool(asUseCase(useCase)).run({query: 'finanzas'}, context)).toEqual({notes: []})
        expect(useCase.search).toHaveBeenCalledExactlyOnceWith('finanzas', 'owner-uid')
    })

    it('lists the most recent notes without a query', async () => {
        const useCase = manageNotes()

        await buildSearchNotesTool(asUseCase(useCase)).run({}, context)

        expect(useCase.search).toHaveBeenCalledExactlyOnceWith('', 'owner-uid')
    })
})

describe('read_note tool', () => {
    it('reads the note for the user asking', async () => {
        const useCase = manageNotes()

        expect(await buildReadNoteTool(asUseCase(useCase)).run({title: 'Otra'}, context)).toEqual({error: 'NOT_FOUND'})
        expect(useCase.read).toHaveBeenCalledExactlyOnceWith({title: 'Otra'}, 'owner-uid')
    })
})

describe('update_note tool', () => {
    it('updates the note for the user asking', async () => {
        const useCase = manageNotes()
        const input = {title: 'Skill de finanzas', content: 'Y avisar de gastos raros.', mode: 'append' as const}

        expect(await buildUpdateNoteTool(asUseCase(useCase)).run(input, context)).toEqual({updated: true})
        expect(useCase.update).toHaveBeenCalledExactlyOnceWith(input, 'owner-uid')
    })
})

describe('link_notes tool', () => {
    it('links the notes for the user asking', async () => {
        const useCase = manageNotes()

        expect(await buildLinkNotesTool(asUseCase(useCase)).run({from: 'Skill de finanzas', to: 'Elber'}, context)).toEqual({linked: true})
        expect(useCase.link).toHaveBeenCalledExactlyOnceWith({from: 'Skill de finanzas', to: 'Elber'}, 'owner-uid')
    })
})
