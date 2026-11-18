import type { z } from 'zod'

// Contract between Elber's skills (weather, memory...) and the chat, which
// offers their tools to the assistant. It lives in the chat's domain because
// skills are plugins of the chat, not modules of their own: only the chat
// ever uses them. It knows nothing of the agent framework: the chat's adapter
// translates it.

export interface Coords {
    lat: number
    lon: number
}

// Something a tool shows the user in the chat, next to Elber's answer (a
// weather card...). The chat stores and sends it without looking inside: each
// `type` has its own `data` and its own component in the frontend.
export interface Widget {
    type: string
    data: unknown
}

// What a tool knows about the request it runs in.
export interface SkillContext {
    uid: string
    // The conversation the answer belongs to (in the diary, its day).
    conversationId: string
    // Aborted when the user stops the answer.
    signal: AbortSignal
    // Asks the user's device where they are. null if they refused or it is
    // unavailable.
    locate(): Promise<Coords | null>
    // Shows a widget in the answer. The model still answers in words.
    show(widget: Widget): void
}

export interface SkillTool<Shape extends z.ZodRawShape = z.ZodRawShape> {
    // snake_case, unique among all skills.
    name: string
    // The model reads it to decide when to call the tool.
    description: string
    input: Shape
    // Its result goes to the model as JSON. Expected outcomes the model must
    // react to (place not found...) are results, not errors; it throws only
    // when the tool fails.
    run(input: z.infer<z.ZodObject<Shape>>, context: SkillContext): Promise<unknown>
}

// What a skill module hands the chat.
export interface Skill {
    tools: SkillTool[]
    // What Elber should know about the user before answering (their
    // profile...), added to the system prompt. null when there is nothing.
    context?(uid: string): Promise<string | null>
}

// Infers the input type from the shape when defining a tool.
export const defineTool = <Shape extends z.ZodRawShape>(tool: SkillTool<Shape>): SkillTool =>
    tool as unknown as SkillTool
