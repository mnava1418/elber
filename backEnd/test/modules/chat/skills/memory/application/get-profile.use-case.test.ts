import { describe, expect, it, vi } from 'vitest'
import GetProfileUseCase from '../../../../../../src/modules/chat/skills/memory/application/get-profile.use-case.js'
import type { NoteFile } from '../../../../../../src/modules/chat/skills/memory/domain/note-file.port.js'

const OWNER = 'owner-uid'

const storeWith = (note: string) => ({read: vi.fn<NoteFile['read']>(async () => note), write: vi.fn<NoteFile['write']>()})

describe('GetProfileUseCase', () => {
    it("gives the owner's profile, trimmed", async () => {
        const useCase = new GetProfileUseCase(storeWith('\n## Gustos\n- El café\n\n'), OWNER)

        expect(await useCase.execute(OWNER)).toBe('## Gustos\n- El café')
    })

    it('gives nothing while the profile is empty', async () => {
        const useCase = new GetProfileUseCase(storeWith('  \n'), OWNER)

        expect(await useCase.execute(OWNER)).toBeNull()
    })

    it("never reads the owner's profile for anyone else", async () => {
        const store = storeWith('## Gustos\n- El café\n')
        const useCase = new GetProfileUseCase(store, OWNER)

        expect(await useCase.execute('friend-uid')).toBeNull()
        expect(store.read).not.toHaveBeenCalled()
    })
})
