// What the assistant emits while it answers, in order.
export type AssistantEvent =
    // A piece of the answer text, to append to what came before.
    | {type: 'delta', text: string}
    // The assistant is using a tool, e.g. searching the web. `detail` is a
    // short human-readable hint (the search query, the URL...).
    | {type: 'tool', name: string, detail?: string}
    // The sources the answer can cite as [n], complete so far: each one
    // replaces the previous list.
    | {type: 'sources', sources: Source[]}
    // Opaque id of the conversation this answer belongs to: pass it as
    // `sessionId` in the next reply to continue it.
    | {type: 'session', id: string}

// A page the answer cites as [n].
export interface Source {
    n: number
    url: string
    title: string
}

export interface ReplyInput {
    text: string
    // Aborting it stops the answer (and its cost) as soon as possible.
    signal: AbortSignal
    // Continues that conversation (its earlier messages are the context);
    // without it, the answer starts a new one.
    sessionId?: string
}

// Port: the chat depends on this, not on a specific agent framework.
// The iteration ends when the answer is complete; it throws if it fails.
export interface Assistant {
    reply(input: ReplyInput): AsyncIterable<AssistantEvent>
}
