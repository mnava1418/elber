import { describe, expect, it } from 'vitest'
import { addLink, appendToBody, cleanTags, cleanTitle, linksIn, linksOf, searchNotes, type Note } from '../../../../src/modules/memory/domain/notes.js'

const note = (title: string, fields: Partial<Note> = {}): Note => ({
    title,
    type: 'idea',
    tags: [],
    created: '2026-10-20',
    updated: '2026-10-20',
    body: '',
    ...fields,
})

describe('cleanTitle', () => {
    it('keeps a normal title as it is', () => {
        expect(cleanTitle('Skill de finanzas')).toBe('Skill de finanzas')
    })

    it('drops what a file name or a [[link]] can\'t have', () => {
        expect(cleanTitle('Ideas: app/web [v2] #1?')).toBe('Ideas app web v2 1')
    })

    it("can't leave the notes folder or hide the file", () => {
        expect(cleanTitle('../../secretos')).toBe('secretos')
        expect(cleanTitle('.oculta')).toBe('oculta')
    })

    it('is null when nothing is left', () => {
        expect(cleanTitle(' /:? ')).toBeNull()
        expect(cleanTitle('...')).toBeNull()
    })

    it('cuts long titles', () => {
        expect(cleanTitle('a'.repeat(150))).toHaveLength(100)
    })
})

describe('cleanTags', () => {
    it('writes tags the way Obsidian accepts them', () => {
        expect(cleanTags(['#Finanzas', 'vida diaria', 'proyectos/elber', 'c++', '2026'])).toEqual([
            'finanzas', 'vida-diaria', 'proyectos/elber', 'c',
        ])
    })

    it('drops empty and repeated tags', () => {
        expect(cleanTags(['elber', ' Elber ', '#', ''])).toEqual(['elber'])
    })
})

describe('searchNotes', () => {
    const notes = [
        note('Skill de finanzas', {tags: ['elber'], updated: '2026-10-22', body: 'Leer los estados de cuenta del banco.'}),
        note('Viaje a Oaxaca', {type: 'proyecto', updated: '2026-10-24', body: 'Ir en diciembre con la familia.'}),
        note('Escrita a mano', {type: null, updated: null, body: 'Una nota sin propiedades sobre el banco.'}),
    ]

    it('finds every word in the title, tags or text, ignoring case and accents', () => {
        expect(searchNotes(notes, 'ELBER banco', 10).map((n) => n.title)).toEqual(['Skill de finanzas'])
        expect(searchNotes(notes, 'oaxaca', 10).map((n) => n.title)).toEqual(['Viaje a Oaxaca'])
        expect(searchNotes([note('Médico', {body: 'Cita anual'})], 'medico', 10)).toHaveLength(1)
    })

    it('lists the most recently updated first, undated last', () => {
        expect(searchNotes(notes, '', 10).map((n) => n.title)).toEqual(['Viaje a Oaxaca', 'Skill de finanzas', 'Escrita a mano'])
    })

    it('gives at most the limit', () => {
        expect(searchNotes(notes, '', 1)).toHaveLength(1)
    })

    it('summarizes each note with an excerpt around the match', () => {
        const long = note('Larga', {body: `${'Relleno. '.repeat(30)}Aquí está el banco. ${'Más. '.repeat(30)}`})

        const [summary] = searchNotes([long], 'banco', 10)

        expect(summary).toMatchObject({title: 'Larga', type: 'idea', tags: [], updated: '2026-10-20'})
        expect(summary.excerpt).toContain('Aquí está el banco')
        expect(summary.excerpt.startsWith('…')).toBe(true)
        expect(summary.excerpt.endsWith('…')).toBe(true)
    })
})

describe('appendToBody', () => {
    it('adds the text as a paragraph of its own', () => {
        expect(appendToBody('Primera idea.\n', ' Segunda idea. ')).toBe('Primera idea.\n\nSegunda idea.\n')
    })

    it('starts an empty note', () => {
        expect(appendToBody('  \n', 'Algo')).toBe('Algo\n')
    })
})

describe('linksIn', () => {
    it('finds every kind of link to a note, once each', () => {
        const body = 'Ver [[Viaje a Oaxaca]], [[Skill de finanzas|la de finanzas]], [[Viaje a Oaxaca#Hotel]], '
            + '![[Mapa]] y [[ideas.md]]. Otra vez [[viaje a oaxaca]].'

        expect(linksIn(body)).toEqual(['Viaje a Oaxaca', 'Skill de finanzas', 'Mapa', 'ideas'])
    })

    it('leaves out links to files that are not notes', () => {
        expect(linksIn('![[foto.png]] [[contrato.pdf]] [[Notas v2.0]]')).toEqual(['Notas v2.0'])
    })

    it('is empty without links', () => {
        expect(linksIn('Sin enlaces [ni esto]')).toEqual([])
    })
})

describe('linksOf', () => {
    const project = note('Viaje a Oaxaca', {type: 'proyecto', body: 'Ideas: [[hoteles baratos]] y [[Ruta en coche]].'})
    const hotels = note('Hoteles baratos', {body: 'Para [[Viaje a Oaxaca]].'})
    const other = note('Skill de finanzas', {body: 'Nada que ver, salvo [[Viaje a Oaxaca|el viaje]].'})
    const notes = [project, hotels, other]

    it('gives the notes it links to, named as they are, and which exist', () => {
        expect(linksOf(project, notes).links).toEqual([
            {title: 'Hoteles baratos', exists: true},
            {title: 'Ruta en coche', exists: false},
        ])
    })

    it('gives the notes that link to it', () => {
        expect(linksOf(project, notes).backlinks).toEqual(['Hoteles baratos', 'Skill de finanzas'])
        expect(linksOf(other, notes).backlinks).toEqual([])
    })

    it('ignores a note linking to itself', () => {
        const self = note('Yo', {body: 'Ver [[Yo]].'})

        expect(linksOf(self, [self])).toEqual({links: [], backlinks: []})
    })
})

describe('addLink', () => {
    it('starts a Relacionado section at the end of the note', () => {
        expect(addLink('Una idea.\n', 'Viaje a Oaxaca')).toEqual({body: 'Una idea.\n\n## Relacionado\n- [[Viaje a Oaxaca]]\n', changed: true})
    })

    it('adds to the section that is already there, before what follows it', () => {
        const body = 'Texto\n\n## Relacionado\n- [[Uno]]\n\n## Otra cosa\nMás\n'

        expect(addLink(body, 'Dos').body).toBe('Texto\n\n## Relacionado\n- [[Uno]]\n- [[Dos]]\n\n## Otra cosa\nMás\n')
    })

    it("doesn't link twice, wherever the link already is", () => {
        const body = 'Esto va con [[viaje a oaxaca|el viaje]].\n'

        expect(addLink(body, 'Viaje a Oaxaca')).toEqual({body, changed: false})
    })
})
