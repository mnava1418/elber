import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditProfileUseCase from '../../../../../../src/modules/chat/skills/memory/application/edit-profile.use-case.js'
import type { NoteFile } from '../../../../../../src/modules/chat/skills/memory/domain/note-file.port.js'

const OWNER = 'owner-uid'

// Fake vault: the note in memory. Reads and writes wait a tick, like real
// files do, so edits at the same time interleave unless they are queued.
const fakeStore = (initial = '') => {
    let note = initial
    const store = {
        read: vi.fn<NoteFile['read']>(async () => {
            await Promise.resolve()
            return note
        }),
        write: vi.fn<NoteFile['write']>(async (next) => {
            await Promise.resolve()
            note = next
        }),
    }
    return {store, note: () => note}
}

describe('EditProfileUseCase', () => {
    let vault: ReturnType<typeof fakeStore>
    let useCase: EditProfileUseCase

    beforeEach(() => {
        vault = fakeStore('## Gustos\n- El café\n')
        useCase = new EditProfileUseCase(vault.store, OWNER)
    })

    it('remembers a fact for the owner', async () => {
        const result = await useCase.remember({section: 'Gustos', fact: 'Los tacos'}, OWNER)

        expect(result).toEqual({remembered: true})
        expect(vault.note()).toBe('## Gustos\n- El café\n- Los tacos\n')
    })

    it("tells the model it already knew, without rewriting the note", async () => {
        const result = await useCase.remember({section: 'Gustos', fact: 'el café'}, OWNER)

        expect(result).toEqual({error: 'ALREADY_KNOWN'})
        expect(vault.store.write).not.toHaveBeenCalled()
    })

    it('forgets a fact for the owner', async () => {
        const result = await useCase.forget({fact: 'El café'}, OWNER)

        expect(result).toEqual({forgotten: true})
        expect(vault.note()).toBe('## Gustos\n')
    })

    it('tells the model when the fact to forget is not there', async () => {
        const result = await useCase.forget({fact: 'El té'}, OWNER)

        expect(result).toEqual({error: 'NOT_FOUND'})
        expect(vault.store.write).not.toHaveBeenCalled()
    })

    it("never touches the vault for anyone but its owner", async () => {
        expect(await useCase.remember({section: 'Gustos', fact: 'El té'}, 'friend-uid')).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(await useCase.forget({fact: 'El café'}, 'friend-uid')).toEqual({error: 'MEMORY_UNAVAILABLE'})
        expect(vault.store.read).not.toHaveBeenCalled()
        expect(vault.store.write).not.toHaveBeenCalled()
    })

    it('keeps every fact of edits made at the same time', async () => {
        await Promise.all([
            useCase.remember({section: 'Gustos', fact: 'Los tacos'}, OWNER),
            useCase.remember({section: 'Proyectos', fact: 'Elber'}, OWNER),
            useCase.forget({fact: 'El café'}, OWNER),
        ])

        expect(vault.note()).toBe('## Gustos\n- Los tacos\n\n## Proyectos\n- Elber\n')
    })

    it('keeps editing after a failed write', async () => {
        vault.store.write.mockRejectedValueOnce(new Error('disk full'))

        await expect(useCase.remember({section: 'Gustos', fact: 'Los tacos'}, OWNER)).rejects.toThrow('disk full')
        expect(await useCase.remember({section: 'Gustos', fact: 'El té'}, OWNER)).toEqual({remembered: true})
        expect(vault.note()).toBe('## Gustos\n- El café\n- El té\n')
    })
})
