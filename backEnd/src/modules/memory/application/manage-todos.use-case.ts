import { localIsoDate } from '../../../shared/dates/local-date.js'
import type { NoteFile } from '../domain/note-file.port.js'
import type { NoteStore } from '../domain/note-store.port.js'
import { cleanTitle } from '../domain/notes.js'
import { addTodo, completeTodo, pendingTodos, type Todo } from '../domain/todos.js'
import NoteEditor from './note-editor.js'

export interface AddTodoInput {
    task: string
    // YYYY-MM-DD, or null when it has no date.
    due: string | null
    // The title of the note it belongs to, or null.
    project: string | null
}

export interface CompleteTodoInput {
    // As it appears in the list.
    task: string
}

// The model reads these and reacts: it doesn't claim to have saved (or
// ticked) a to-do when nothing changed. On PROJECT_NOT_FOUND it saves the
// project's note first, or adds the task without it.
export type AddTodoResult = {added: true} | {error: 'ALREADY_PENDING'} | {error: 'PROJECT_NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}
export type CompleteTodoResult = {completed: true} | {error: 'NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}
export type ListTodosResult = {todos: Todo[]} | {error: 'MEMORY_UNAVAILABLE'}

// The vault owner's to-do list. Like the profile, nobody else has one.
class ManageTodosUseCase {
    private readonly editor: NoteEditor

    constructor(
        private readonly todos: NoteFile,
        // Where the projects the to-dos belong to are.
        private readonly notes: NoteStore,
        private readonly ownerUid: string,
        // The day a to-do is ticked. A parameter so tests can fix it.
        private readonly today: () => string = localIsoDate,
    ) {
        this.editor = new NoteEditor(todos)
    }

    add = async ({task, due, project}: AddTodoInput, uid: string): Promise<AddTodoResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        let linked: string | null = null
        if (project !== null) {
            // Named as the note is, so the link works on any disk.
            const clean = cleanTitle(project)
            const note = clean === null ? null : await this.notes.read(clean)
            if (note === null) return {error: 'PROJECT_NOT_FOUND'}
            linked = note.title
        }
        const changed = await this.editor.edit((note) => addTodo(note, task, due, linked))
        return changed ? {added: true} : {error: 'ALREADY_PENDING'}
    }

    complete = async ({task}: CompleteTodoInput, uid: string): Promise<CompleteTodoResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.editor.edit((note) => completeTodo(note, task, this.today()))
        return changed ? {completed: true} : {error: 'NOT_FOUND'}
    }

    list = async (uid: string): Promise<ListTodosResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        return {todos: pendingTodos(await this.todos.read())}
    }
}

export default ManageTodosUseCase
