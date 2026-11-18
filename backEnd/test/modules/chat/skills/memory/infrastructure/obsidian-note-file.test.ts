import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ObsidianNoteFile from '../../../../../../src/modules/chat/skills/memory/infrastructure/obsidian-note-file.js'

// A real, empty vault in tmp: the adapter is only file reads and writes.
describe('ObsidianNoteFile', () => {
    let vault: string

    beforeEach(async () => {
        vault = await mkdtemp(path.join(tmpdir(), 'elber-vault-'))
    })

    afterEach(async () => {
        await rm(vault, {recursive: true, force: true})
    })

    it('reads an empty note before it exists', async () => {
        expect(await new ObsidianNoteFile(vault, 'Perfil.md').read()).toBe('')
    })

    it('creates the note in Elber/ and reads it back', async () => {
        const file = new ObsidianNoteFile(vault, 'Perfil.md')

        await file.write('## Gustos\n- El café\n')

        expect(await readFile(path.join(vault, 'Elber', 'Perfil.md'), 'utf8')).toBe('## Gustos\n- El café\n')
        expect(await file.read()).toBe('## Gustos\n- El café\n')
    })

    it('replaces the note and leaves no temporary file behind', async () => {
        const file = new ObsidianNoteFile(vault, 'Pendientes.md')

        await file.write('- [ ] Uno\n')
        await file.write('- [x] Uno\n')

        expect(await file.read()).toBe('- [x] Uno\n')
        expect(await readdir(path.join(vault, 'Elber'))).toEqual(['Pendientes.md'])
    })
})
