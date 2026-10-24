import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ObsidianProfileStore from '../../../../src/modules/memory/infrastructure/obsidian-profile-store.js'

// A real, empty vault in tmp: the adapter is only file reads and writes.
describe('ObsidianProfileStore', () => {
    let vault: string

    beforeEach(async () => {
        vault = await mkdtemp(path.join(tmpdir(), 'elber-vault-'))
    })

    afterEach(async () => {
        await rm(vault, {recursive: true, force: true})
    })

    it('reads an empty profile before the note exists', async () => {
        expect(await new ObsidianProfileStore(vault).read()).toBe('')
    })

    it('creates Elber/Perfil.md and reads it back', async () => {
        const store = new ObsidianProfileStore(vault)

        await store.write('## Gustos\n- El café\n')

        expect(await readFile(path.join(vault, 'Elber', 'Perfil.md'), 'utf8')).toBe('## Gustos\n- El café\n')
        expect(await store.read()).toBe('## Gustos\n- El café\n')
    })

    it('replaces the note and leaves no temporary file behind', async () => {
        const store = new ObsidianProfileStore(vault)

        await store.write('## Gustos\n- El café\n')
        await store.write('## Gustos\n- El té\n')

        expect(await store.read()).toBe('## Gustos\n- El té\n')
        expect(await readdir(path.join(vault, 'Elber'))).toEqual(['Perfil.md'])
    })
})
