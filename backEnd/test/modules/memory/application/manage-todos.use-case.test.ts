import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManageTodosUseCase from '../../../../src/modules/memory/application/manage-todos.use-case.js'
import type { NoteFile } from '../../../../src/modules/memory/domain/note-file.port.js'

const OWNER = 'owner-uid'
const TODAY = '2026-10-24'

// Fake vault: the note in memory. Reads and writes wait a tick, like real
// files do, so edits at the same time interleave unless they are queued.
const fakeFile = (initial = '') => {
    let note = initial
    const file = {
        read: vi.fn<NoteFile['read']>(async () => {
            await Promise.resolve()
            return note
        }),
        write: vi.fn<NoteFile['write']>(async (next) => {
            await Promise.resolve()
            note = next
        }),
    }
    return {file, note: () => note}
}

describe('ManageTodosUseCase', () => {
    let vault: ReturnType<typeof fakeFile>
    let useCase: ManageTodosUseCase

    beforeEach(() => {
        vault = fakeFile('- [ ] Hablarle a mi familia 📅 2026-10-31\n')
        useCase = new ManageTodosUseCase(vault.file, OWNER, () => TODAY)
    })

    it('adds a to-do for the owner', async () => {
        const result = await useCase.add({task: 'Renovar el pasaporte', due: null}, OWNER)

        expect(result).toEqual({added: true})
        expect(vault.note()).toBe('- [ ] Hablarle a mi familia 📅 2026-10-31\n- [ ] Renovar el pasaporte\n')
    })

    it('tells the model the to-do was already pending, without rewriting the note', async () => {
        const result = await useCase.add({task: 'hablarle a mi familia', due: '2026-10-31'}, OWNER)

        expect(result).toEqual({error: 'ALREADY_PENDING'})
        expect(vault.file.write).not.toHaveBeenCalled()
    })

    it('ticks a to-do on the day it was done', async () => {
        const result = await useCase.complete({task: 'Hablarle a mi familia'}, OWNER)

        expect(result).toEqual({completed: true})
        expect(vault.note()).toBe('- [x] Hablarle a mi familia 📅 2026-10-31 ✅ 2026-10-24\n')
    })

    it('tells the model when the to-do to tick is not there', async () => {
        expect(await useCase.complete({task: 'Ir al dentista'}, OWNER)).toEqual({error: 'NOT_FOUND'})
        expect(vault.file.write).not.toHaveBeenCalled()
    })

    it('lists the pending to-dos', async () => {
        expect(await useCase.list(OWNER)).toEqual({todos: [{task: 'Hablarle a mi familia', due: '2026-10-31'}]})
    })

    it('never touches the vault for anyone but its owner', async () => {
        expect(await useCase.add({task: 'Algo', due: null}, 'friend-uid')).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.complete({task: 'Hablarle a mi familia'}, 'friend-uid')).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.list('friend-uid')).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(vault.file.read).not.toHaveBeenCalled()
        expect(vault.file.write).not.toHaveBeenCalled()
    })

    it('keeps every change of edits made at the same time', async () => {
        await Promise.all([
            useCase.add({task: 'Uno', due: null}, OWNER),
            useCase.add({task: 'Dos', due: '2026-11-01'}, OWNER),
            useCase.complete({task: 'Hablarle a mi familia'}, OWNER),
        ])

        expect(vault.note()).toBe('- [x] Hablarle a mi familia 📅 2026-10-31 ✅ 2026-10-24\n- [ ] Uno\n- [ ] Dos 📅 2026-11-01\n')
    })
})
