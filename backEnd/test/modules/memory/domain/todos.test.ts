import { describe, expect, it } from 'vitest'
import { addTodo, completeTodo, pendingTodos } from '../../../../src/modules/memory/domain/todos.js'

const NOTE = `# Pendientes

- [ ] Hablarle a mi familia 📅 2026-10-31
- [x] Pagar la tarjeta ✅ 2026-10-20
* [ ] Renovar el pasaporte

Algo que escribí yo a mano.
`

describe('addTodo', () => {
    it('adds the to-do at the end of the note, with its due date', () => {
        const {note, changed} = addTodo(NOTE, 'Llevar el coche al servicio', '2026-11-02', null)

        expect(changed).toBe(true)
        expect(note).toBe(`${NOTE}- [ ] Llevar el coche al servicio 📅 2026-11-02\n`)
    })

    it('adds it without a date, on one line', () => {
        const {note} = addTodo('', 'Comprar\n  leche', null, null)

        expect(note).toBe('- [ ] Comprar leche\n')
    })

    it("doesn't add a to-do that is already pending", () => {
        expect(addTodo(NOTE, '  hablarle a mi familia. ', '2026-11-07', null)).toEqual({note: NOTE, changed: false})
    })

    it('adds again one that was already done', () => {
        const {changed} = addTodo(NOTE, 'Pagar la tarjeta', '2026-11-20', null)

        expect(changed).toBe(true)
    })

    it('links the to-do to its project, before the date', () => {
        const {note} = addTodo('', 'Reservar el hotel', '2026-11-15', 'Viaje a Oaxaca')

        expect(note).toBe('- [ ] Reservar el hotel [[Viaje a Oaxaca]] 📅 2026-11-15\n')
    })

    it('drops trailing blank lines before adding', () => {
        const {note} = addTodo('- [ ] Uno\n\n\n', 'Dos', null, null)

        expect(note).toBe('- [ ] Uno\n- [ ] Dos\n')
    })
})

describe('completeTodo', () => {
    it('ticks the to-do and stamps the day, keeping its due date', () => {
        const {note, changed} = completeTodo(NOTE, 'Hablarle a mi familia', '2026-10-24')

        expect(changed).toBe(true)
        expect(note).toBe(NOTE.replace('- [ ] Hablarle a mi familia 📅 2026-10-31', '- [x] Hablarle a mi familia 📅 2026-10-31 ✅ 2026-10-24'))
    })

    it('keeps the bullet the owner used', () => {
        const {note} = completeTodo(NOTE, 'renovar el pasaporte', '2026-10-24')

        expect(note).toContain('* [x] Renovar el pasaporte ✅ 2026-10-24\n')
    })

    it("doesn't find one already done, or one that isn't there", () => {
        expect(completeTodo(NOTE, 'Pagar la tarjeta', '2026-10-24')).toEqual({note: NOTE, changed: false})
        expect(completeTodo(NOTE, 'Ir al dentista', '2026-10-24')).toEqual({note: NOTE, changed: false})
    })
})

describe('pendingTodos', () => {
    it('lists the to-dos not done yet, with their due dates', () => {
        expect(pendingTodos(NOTE)).toEqual([
            {task: 'Hablarle a mi familia', due: '2026-10-31', project: null},
            {task: 'Renovar el pasaporte', due: null, project: null},
        ])
    })

    it('ignores other Tasks plugin markers in the text', () => {
        expect(pendingTodos('- [ ] Declarar impuestos ⏳ 2026-11-01 📅 2026-11-30\n')).toEqual([
            {task: 'Declarar impuestos', due: '2026-11-30', project: null},
        ])
    })

    it('gives the project linked at the end of the task', () => {
        const note = '- [ ] Reservar el hotel [[Viaje a Oaxaca]] 📅 2026-11-15\n'
            + '- [ ] Llamar a [[Juan]] sobre el coche\n'
            + '- [ ] Pedir cotización [[Remodelación|la remodelación]]\n'
            + '- [ ] [[Solo un enlace]]\n'

        expect(pendingTodos(note)).toEqual([
            {task: 'Reservar el hotel', due: '2026-11-15', project: 'Viaje a Oaxaca'},
            {task: 'Llamar a [[Juan]] sobre el coche', due: null, project: null},
            {task: 'Pedir cotización', due: null, project: 'Remodelación'},
            {task: '[[Solo un enlace]]', due: null, project: null},
        ])
    })

    it('ticks a to-do of a project by its task alone', () => {
        const {note} = completeTodo('- [ ] Reservar el hotel [[Viaje a Oaxaca]]\n', 'Reservar el hotel', '2026-10-24')

        expect(note).toBe('- [x] Reservar el hotel [[Viaje a Oaxaca]] ✅ 2026-10-24\n')
    })

    it('is empty for an empty note', () => {
        expect(pendingTodos('')).toEqual([])
    })
})
