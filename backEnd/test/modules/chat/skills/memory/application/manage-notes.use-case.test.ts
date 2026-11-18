import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManageNotesUseCase from '../../../../../../src/modules/chat/skills/memory/application/manage-notes.use-case.js'
import type { NoteFile } from '../../../../../../src/modules/chat/skills/memory/domain/note-file.port.js'
import type { NoteStore } from '../../../../../../src/modules/chat/skills/memory/domain/note-store.port.js'
import type { Note } from '../../../../../../src/modules/chat/skills/memory/domain/notes.js'

const OWNER = 'owner-uid'
const TODAY = '2026-10-24'

const IDEA: Note = {
    title: 'Skill de finanzas',
    type: 'idea',
    tags: ['elber'],
    created: '2026-10-20',
    updated: '2026-10-20',
    body: 'Leer los estados de cuenta.\n',
}

// Fake vault: the notes in memory, found ignoring case like the real one.
// Reads and writes wait a tick, like real files do, so edits at the same time
// interleave unless they are queued.
const fakeStore = (initial: Note[]) => {
    const notes = new Map(initial.map((note) => [note.title.toLowerCase(), note]))
    const store = {
        list: vi.fn<NoteStore['list']>(async () => [...notes.values()]),
        read: vi.fn<NoteStore['read']>(async (title) => {
            await Promise.resolve()
            return notes.get(title.toLowerCase()) ?? null
        }),
        write: vi.fn<NoteStore['write']>(async (note) => {
            await Promise.resolve()
            notes.set(note.title.toLowerCase(), note)
        }),
    }
    return {store, note: (title: string) => notes.get(title.toLowerCase())}
}

// The to-do list: one of the idea's tasks is pending, another one done.
const todos: NoteFile = {
    read: async () => '- [ ] Abrir la cuenta [[skill de finanzas]]\n- [x] Elegir banco [[Skill de finanzas]] ✅ 2026-10-21\n- [ ] Otra cosa\n',
    write: async () => {},
}

describe('ManageNotesUseCase', () => {
    let vault: ReturnType<typeof fakeStore>
    let useCase: ManageNotesUseCase

    beforeEach(() => {
        vault = fakeStore([IDEA])
        useCase = new ManageNotesUseCase(vault.store, todos, OWNER, () => TODAY)
    })

    describe('save', () => {
        it('saves a new note dated today, with a clean title and tags', async () => {
            const result = await useCase.save({title: 'Viaje: Oaxaca', type: 'proyecto', tags: ['#Viajes'], content: ' Ir en diciembre. '}, OWNER)

            expect(result).toEqual({saved: true, title: 'Viaje Oaxaca'})
            expect(vault.note('Viaje Oaxaca')).toEqual({
                title: 'Viaje Oaxaca', type: 'proyecto', tags: ['viajes'], created: TODAY, updated: TODAY, body: 'Ir en diciembre.\n',
            })
        })

        it("doesn't replace a note that already exists, and names it", async () => {
            const result = await useCase.save({title: 'skill de finanzas', type: 'idea', tags: [], content: 'Otra cosa'}, OWNER)

            expect(result).toEqual({error: 'ALREADY_EXISTS', title: 'Skill de finanzas'})
            expect(vault.store.write).not.toHaveBeenCalled()
        })

        it('rejects a title with nothing left once cleaned', async () => {
            expect(await useCase.save({title: '../', type: 'nota', tags: [], content: 'Algo'}, OWNER)).toEqual({error: 'INVALID_TITLE'})
            expect(vault.store.write).not.toHaveBeenCalled()
        })

        it('saves only one of two notes with the same title at the same time', async () => {
            const results = await Promise.all([
                useCase.save({title: 'Nueva', type: 'idea', tags: [], content: 'Uno'}, OWNER),
                useCase.save({title: 'Nueva', type: 'idea', tags: [], content: 'Dos'}, OWNER),
            ])

            expect(results).toEqual([{saved: true, title: 'Nueva'}, {error: 'ALREADY_EXISTS', title: 'Nueva'}])
            expect(vault.note('Nueva')?.body).toBe('Uno\n')
        })
    })

    it('searches the notes', async () => {
        const result = await useCase.search('estados de cuenta', OWNER)

        expect(result).toEqual({notes: [{title: 'Skill de finanzas', type: 'idea', tags: ['elber'], updated: '2026-10-20', excerpt: 'Leer los estados de cuenta.'}]})
    })

    describe('read', () => {
        it('gives the whole note', async () => {
            expect(await useCase.read({title: 'Skill de finanzas'}, OWNER)).toEqual({
                note: IDEA, links: [], backlinks: [], todos: [{task: 'Abrir la cuenta', due: null, project: 'skill de finanzas'}],
            })
        })

        it('gives the notes it links to and the ones linking to it', async () => {
            const project: Note = {...IDEA, title: 'Elber', type: 'proyecto', body: 'Skills: [[skill de finanzas]], [[Skill de salud]].'}
            vault = fakeStore([IDEA, project])
            useCase = new ManageNotesUseCase(vault.store, todos, OWNER, () => TODAY)

            expect(await useCase.read({title: 'Elber'}, OWNER)).toMatchObject({
                links: [{title: 'Skill de finanzas', exists: true}, {title: 'Skill de salud', exists: false}],
                backlinks: [],
            })
            expect(await useCase.read({title: 'Skill de finanzas'}, OWNER)).toMatchObject({links: [], backlinks: ['Elber']})
        })

        it('tells the model when there is no such note', async () => {
            expect(await useCase.read({title: 'Otra'}, OWNER)).toEqual({error: 'NOT_FOUND'})
            expect(await useCase.read({title: '///'}, OWNER)).toEqual({error: 'NOT_FOUND'})
        })
    })

    describe('update', () => {
        it('adds to the end of the note and dates the change', async () => {
            const result = await useCase.update({title: 'skill de finanzas', content: 'Y avisar de gastos raros.', mode: 'append'}, OWNER)

            expect(result).toEqual({updated: true})
            expect(vault.note('Skill de finanzas')).toEqual({
                ...IDEA, updated: TODAY, body: 'Leer los estados de cuenta.\n\nY avisar de gastos raros.\n',
            })
        })

        it('rewrites the text, keeping the rest of the note', async () => {
            await useCase.update({title: 'Skill de finanzas', content: 'Todo nuevo.', mode: 'replace'}, OWNER)

            expect(vault.note('Skill de finanzas')).toEqual({...IDEA, updated: TODAY, body: 'Todo nuevo.\n'})
        })

        it('tells the model when there is no such note', async () => {
            expect(await useCase.update({title: 'Otra', content: 'Algo', mode: 'append'}, OWNER)).toEqual({error: 'NOT_FOUND'})
            expect(vault.store.write).not.toHaveBeenCalled()
        })

        it('keeps every addition made at the same time', async () => {
            await Promise.all([
                useCase.update({title: 'Skill de finanzas', content: 'Uno.', mode: 'append'}, OWNER),
                useCase.update({title: 'Skill de finanzas', content: 'Dos.', mode: 'append'}, OWNER),
            ])

            expect(vault.note('Skill de finanzas')?.body).toBe('Leer los estados de cuenta.\n\nUno.\n\nDos.\n')
        })
    })

    describe('link', () => {
        const PROJECT: Note = {...IDEA, title: 'Elber', type: 'proyecto', body: 'Mi asistente.\n'}

        beforeEach(() => {
            vault = fakeStore([IDEA, PROJECT])
            useCase = new ManageNotesUseCase(vault.store, todos, OWNER, () => TODAY)
        })

        it('links one note to the other, named as it is, and dates the change', async () => {
            const result = await useCase.link({from: 'skill de finanzas', to: 'elber'}, OWNER)

            expect(result).toEqual({linked: true})
            expect(vault.note('Skill de finanzas')).toEqual({
                ...IDEA, updated: TODAY, body: 'Leer los estados de cuenta.\n\n## Relacionado\n- [[Elber]]\n',
            })
            expect(vault.note('Elber')).toEqual(PROJECT)
        })

        it('tells the model when they were already linked', async () => {
            await useCase.link({from: 'Skill de finanzas', to: 'Elber'}, OWNER)
            vault.store.write.mockClear()

            expect(await useCase.link({from: 'Skill de finanzas', to: 'Elber'}, OWNER)).toEqual({error: 'ALREADY_LINKED'})
            expect(vault.store.write).not.toHaveBeenCalled()
        })

        it('tells the model which note is missing', async () => {
            expect(await useCase.link({from: 'Otra', to: 'Elber'}, OWNER)).toEqual({error: 'NOT_FOUND', title: 'Otra'})
            expect(await useCase.link({from: 'Elber', to: 'Otra'}, OWNER)).toEqual({error: 'NOT_FOUND', title: 'Otra'})
            expect(vault.store.write).not.toHaveBeenCalled()
        })

        it("doesn't link a note to itself", async () => {
            expect(await useCase.link({from: 'Elber', to: 'ELBER'}, OWNER)).toEqual({error: 'SAME_NOTE'})
        })
    })

    it('never touches the vault for anyone but its owner', async () => {
        const friend = 'friend-uid'

        expect(await useCase.save({title: 'Algo', type: 'idea', tags: [], content: 'Algo'}, friend)).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.search('', friend)).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.read({title: 'Skill de finanzas'}, friend)).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.update({title: 'Skill de finanzas', content: 'Algo', mode: 'append'}, friend)).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.link({from: 'Skill de finanzas', to: 'Elber'}, friend)).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(vault.store.list).not.toHaveBeenCalled()
        expect(vault.store.read).not.toHaveBeenCalled()
        expect(vault.store.write).not.toHaveBeenCalled()
    })
})
