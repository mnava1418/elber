import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Note } from '../../../../src/modules/memory/domain/notes.js'
import ObsidianNotes from '../../../../src/modules/memory/infrastructure/obsidian-notes.js'

const IDEA: Note = {
    title: 'Skill de finanzas',
    type: 'idea',
    tags: ['elber', 'finanzas'],
    created: '2026-10-24',
    updated: '2026-10-24',
    body: 'Leer los estados de cuenta.\n',
}

// A real, empty vault in tmp: the adapter is only file reads and writes.
describe('ObsidianNotes', () => {
    let vault: string
    let folder: string
    let notes: ObsidianNotes

    const fileOf = (title: string) => path.join(folder, `${title}.md`)

    // A note the owner wrote in Obsidian.
    const handWritten = async (title: string, markdown: string) => {
        await mkdir(folder, {recursive: true})
        await writeFile(fileOf(title), markdown, 'utf8')
    }

    beforeEach(async () => {
        vault = await mkdtemp(path.join(tmpdir(), 'elber-vault-'))
        folder = path.join(vault, 'Elber', 'Notas')
        notes = new ObsidianNotes(vault)
    })

    afterEach(async () => {
        await rm(vault, {recursive: true, force: true})
    })

    it('has no notes before the folder exists', async () => {
        expect(await notes.list()).toEqual([])
        expect(await notes.read('Skill de finanzas')).toBeNull()
    })

    it('writes the note in Elber/Notas with Obsidian properties, and reads it back', async () => {
        await notes.write(IDEA)

        expect(await readFile(fileOf('Skill de finanzas'), 'utf8')).toBe(`---
type: idea
tags:
  - elber
  - finanzas
created: 2026-10-24
updated: 2026-10-24
---
Leer los estados de cuenta.
`)
        expect(await notes.read('Skill de finanzas')).toEqual(IDEA)
        expect(await notes.list()).toEqual([IDEA])
    })

    it('finds a note ignoring case, keeping its name', async () => {
        await notes.write(IDEA)

        expect((await notes.read('SKILL DE FINANZAS'))?.title).toBe('Skill de finanzas')
    })

    it('reads tags written as one string, and a note without properties', async () => {
        await handWritten('Una', '---\ntags: "#viajes, familia"\n---\nTexto\n')
        await handWritten('Otra', 'Solo texto, a---b\n')

        expect(await notes.read('Una')).toMatchObject({type: null, tags: ['viajes', 'familia'], created: null, body: 'Texto\n'})
        expect(await notes.read('Otra')).toEqual({title: 'Otra', type: null, tags: [], created: null, updated: null, body: 'Solo texto, a---b\n'})
    })

    it("treats properties Obsidian couldn't read as text", async () => {
        await handWritten('Rota', '---\ntags: [sin cerrar\n---\nTexto\n')

        expect(await notes.read('Rota')).toMatchObject({tags: [], body: 'Texto\n'})
    })

    it('keeps the properties the owner added when it rewrites a note', async () => {
        await handWritten('Skill de finanzas', '---\ntype: idea\n# Mía\nprioridad: alta\ncreated: 2026-10-20\n---\nViejo\n')

        await notes.write({...IDEA, created: null, updated: '2026-10-24', body: 'Nuevo\n'})

        const markdown = await readFile(fileOf('Skill de finanzas'), 'utf8')
        expect(markdown).toContain('# Mía\nprioridad: alta\n')
        expect(markdown).toContain('created: 2026-10-20\n')
        expect(markdown).toContain('updated: 2026-10-24\n')
        expect(markdown.endsWith('---\nNuevo\n')).toBe(true)
    })

    it('ignores other files and leaves no temporary file behind', async () => {
        await handWritten('.oculta', 'x')
        await writeFile(path.join(folder, 'imagen.png'), '')

        await notes.write(IDEA)

        expect((await notes.list()).map((note) => note.title)).toEqual(['Skill de finanzas'])
        expect((await readdir(folder)).sort()).toEqual(['.oculta.md', 'Skill de finanzas.md', 'imagen.png'])
    })
})
