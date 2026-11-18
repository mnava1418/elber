import { describe, expect, it } from 'vitest'
import { addFact, removeFact } from '../../../../../../src/modules/chat/skills/memory/domain/profile.js'

const NOTE = `# Perfil

## Sobre mí
- Vive en CDMX
- Es ingeniero

Algo que escribí yo a mano.

## Gustos
- El café de olla
`

describe('addFact', () => {
    it('adds the fact after the last bullet of its section', () => {
        const {note, changed} = addFact(NOTE, 'Sobre mí', 'Tiene un perro')

        expect(changed).toBe(true)
        expect(note).toBe(NOTE.replace('- Es ingeniero\n', '- Es ingeniero\n- Tiene un perro\n'))
    })

    it('finds the section ignoring case and spacing', () => {
        const {note} = addFact(NOTE, '  gustos ', 'Los tacos al pastor')

        expect(note.endsWith('- El café de olla\n- Los tacos al pastor\n')).toBe(true)
    })

    it('creates a missing section at the end of the note', () => {
        const {note} = addFact(NOTE, 'Proyectos', 'Elber, su asistente personal')

        expect(note).toBe(NOTE + '\n## Proyectos\n- Elber, su asistente personal\n')
    })

    it('starts an empty note', () => {
        expect(addFact('', 'Gustos', 'El café')).toEqual({note: '## Gustos\n- El café\n', changed: true})
    })

    it('puts the first fact of an empty section right below its heading', () => {
        const {note} = addFact('## Gustos\n\n## Proyectos\n- Elber\n', 'Gustos', 'El café')

        expect(note).toBe('## Gustos\n- El café\n\n## Proyectos\n- Elber\n')
    })

    it('keeps a section that has ### subsections in one piece', () => {
        const {note} = addFact('## Proyectos\n### Elber\n- Usa Claude\n## Gustos\n', 'Proyectos', 'Un blog')

        expect(note).toBe('## Proyectos\n### Elber\n- Usa Claude\n- Un blog\n## Gustos\n')
    })

    it("doesn't add a fact that is already in the note, in any section", () => {
        expect(addFact(NOTE, 'Gustos', 'vive en  cdmx.')).toEqual({note: NOTE, changed: false})
    })

    it('writes the fact on a single line', () => {
        const {note} = addFact('', 'Gustos', 'El café\nde olla')

        expect(note).toBe('## Gustos\n- El café de olla\n')
    })
})

describe('removeFact', () => {
    it('removes only that line', () => {
        const {note, changed} = removeFact(NOTE, 'es ingeniero.')

        expect(changed).toBe(true)
        expect(note).toBe(NOTE.replace('- Es ingeniero\n', ''))
    })

    it('reports a fact that is not in the note', () => {
        expect(removeFact(NOTE, 'Vive en Madrid')).toEqual({note: NOTE, changed: false})
    })

    it("doesn't touch text that isn't a bullet", () => {
        expect(removeFact(NOTE, 'Algo que escribí yo a mano').changed).toBe(false)
    })
})
