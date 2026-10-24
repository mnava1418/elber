// The owner's to-dos: one note of Obsidian checkboxes, which the owner can
// also tick by hand. Dates use the format of Obsidian's Tasks plugin, so the
// note works with it too:
//
//   - [ ] Hablarle a mi familia 📅 2026-10-31
//   - [ ] Reservar el hotel [[Viaje a Oaxaca]] 📅 2026-11-15
//   - [x] Pagar la tarjeta ✅ 2026-10-24
//
// A link at the end of the task is the project (a note) it belongs to; in
// Obsidian, the project shows it among its backlinks.

import { linesOf, normalize, noteOf, oneLine, type NoteEdit } from './note-lines.js'

// A to-do not done yet. `due` is an ISO date (YYYY-MM-DD), or null.
export interface Todo {
    task: string
    due: string | null
    // The title of the note it belongs to, or null.
    project: string | null
}

const TODO = /^(\s*[-*+]\s+\[)( |x|X)(\]\s+)(.+?)\s*$/
const DUE = /📅\s*(\d{4}-\d{2}-\d{2})/
// Other Tasks plugin markers (✅ done, ⏳ scheduled...) followed by a date.
const MARKER = /[📅✅⏳🛫➕❌]\s*\d{4}-\d{2}-\d{2}/gu
// [[Project]] (or [[Project|alias]]...) at the end of the task.
const PROJECT = /\s*\[\[([^\]|#^]+)(?:[|#^][^\]]*)?\]\]$/

interface Checkbox extends Todo {
    done: boolean
}

const checkboxOf = (line: string): Checkbox | null => {
    const match = TODO.exec(line)
    if (match === null) return null
    const text = oneLine(match[4].replace(MARKER, ''))
    const link = PROJECT.exec(text)
    // Links elsewhere in the task ("Llamar a [[Juan]] sobre...") are part of it.
    const task = link === null ? '' : text.slice(0, link.index).trim()
    return {
        done: match[2] !== ' ',
        task: task === '' ? text : task,
        due: DUE.exec(match[4])?.[1] ?? null,
        project: task === '' ? null : link![1].trim(),
    }
}

const isPending = (line: string, task: string) => {
    const checkbox = checkboxOf(line)
    return checkbox !== null && !checkbox.done && normalize(checkbox.task) === normalize(task)
}

// Adds the to-do at the end of the note. One already pending isn't added
// twice; one already done can be added again (it's a new time).
export const addTodo = (note: string, task: string, due: string | null, project: string | null): NoteEdit => {
    const lines = linesOf(note)
    if (lines.some((line) => isPending(line, task))) return {note, changed: false}

    while (lines.length > 0 && lines.at(-1)!.trim() === '') lines.pop()
    lines.push(`- [ ] ${oneLine(task)}${project === null ? '' : ` [[${project}]]`}${due === null ? '' : ` 📅 ${due}`}`)
    return {note: noteOf(lines), changed: true}
}

// Ticks the pending to-do and stamps the day it was done. The model quotes
// the task from the list it was given, so matching is exact apart from case
// and spacing.
export const completeTodo = (note: string, task: string, today: string): NoteEdit => {
    const lines = linesOf(note)
    const at = lines.findIndex((line) => isPending(line, task))
    if (at === -1) return {note, changed: false}

    lines[at] = lines[at].replace(TODO, (_, start, _mark, end, text) => `${start}x${end}${text} ✅ ${today}`)
    return {note: noteOf(lines), changed: true}
}

// The to-dos not done yet, in the note's order.
export const pendingTodos = (note: string): Todo[] => linesOf(note).flatMap((line) => {
    const checkbox = checkboxOf(line)
    return checkbox === null || checkbox.done ? [] : [{task: checkbox.task, due: checkbox.due, project: checkbox.project}]
})
