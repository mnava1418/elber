import { z } from 'zod'
import { defineTool } from '../../../shared/skills/skill.js'
import type ManageTodosUseCase from '../application/manage-todos.use-case.js'

const task = z.string().trim().min(1).max(200)

// Inbound adapters: what the assistant sees of the to-do list.
export const buildAddTodoTool = (todos: ManageTodosUseCase) => defineTool({
    name: 'add_todo',
    description: 'Adds a task to the user\'s to-do list, a note they also see and tick off in Obsidian. '
        + 'Use it when the user asks you to remind them to do something ("recuérdame llamar a mi mamá", '
        + '"tengo que pagar la luz el viernes", "no me dejes olvidar...") or to add a task. '
        + 'It is for things to do, not facts about the user: those go to remember. '
        + 'Write the task short, as an action, in the user\'s language and without the date, e.g. "Hablarle a mi familia". '
        + 'If they give a day ("el sábado", "mañana"), work out the date from today\'s and pass it as due. '
        + 'You can\'t alert them on that day; if they seem to expect it, tell them it is on their list. '
        + 'If the task is clearly part of one of their projects (a note), pass it as project.',
    input: {
        task: task.describe('The task, on one line.'),
        due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe(
            'When it is due, as YYYY-MM-DD. Leave it out if the task has no date.',
        ),
        project: z.string().trim().min(1).max(100).optional().describe(
            'Title of the note (usually a proyecto) the task belongs to, as search_notes gives it. '
            + 'Leave it out if it belongs to none.',
        ),
    },
    run: ({task, due, project}, {uid}) => todos.add({task, due: due ?? null, project: project ?? null}, uid),
})

export const buildCompleteTodoTool = (todos: ManageTodosUseCase) => defineTool({
    name: 'complete_todo',
    description: 'Ticks a task off the user\'s to-do list. Use it when they tell you they did it, or ask you to '
        + 'remove it. Quote the task as list_todos returns it; call list_todos first if you don\'t have it.',
    input: {
        task: task.describe('The task exactly as it appears in the list.'),
    },
    run: (input, {uid}) => todos.complete(input, uid),
})

export const buildListTodosTool = (todos: ManageTodosUseCase) => defineTool({
    name: 'list_todos',
    description: 'The user\'s pending tasks, each with its due date (YYYY-MM-DD, or null if it has none) '
        + 'and the project note it belongs to (or null). '
        + 'Use it when they ask what they have to do (today, this week...) or before ticking a task off.',
    input: {},
    run: (_input, {uid}) => todos.list(uid),
})
