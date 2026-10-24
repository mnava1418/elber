import { localIsoDate } from '../../../shared/dates/local-date.js'
import type { NoteFile } from '../domain/note-file.port.js'
import { addTodo, completeTodo, pendingTodos, type Todo } from '../domain/todos.js'
import NoteEditor from './note-editor.js'

export interface AddTodoInput {
    task: string
    // YYYY-MM-DD, or null when it has no date.
    due: string | null
}

export interface CompleteTodoInput {
    // As it appears in the list.
    task: string
}

// The model reads these and reacts: it doesn't claim to have saved (or
// ticked) a to-do when nothing changed.
export type AddTodoResult = {added: true} | {error: 'ALREADY_PENDING'} | {error: 'MEMORY_UNAVAILABLE'}
export type CompleteTodoResult = {completed: true} | {error: 'NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}
export type ListTodosResult = {todos: Todo[]} | {error: 'MEMORY_UNAVAILABLE'}

// The vault owner's to-do list. Like the profile, nobody else has one.
class ManageTodosUseCase {
    private readonly editor: NoteEditor

    constructor(
        private readonly todos: NoteFile,
        private readonly ownerUid: string,
        // The day a to-do is ticked. A parameter so tests can fix it.
        private readonly today: () => string = localIsoDate,
    ) {
        this.editor = new NoteEditor(todos)
    }

    add = async ({task, due}: AddTodoInput, uid: string): Promise<AddTodoResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.editor.edit((note) => addTodo(note, task, due))
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
