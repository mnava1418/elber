import { query, type HookCallbackMatcher, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { Assistant, AssistantEvent, ReplyInput } from '../domain/assistant.port.js'
import { ELBER_SYSTEM_PROMPT } from './elber-system-prompt.js'
import { citationContext, SourceList, sourcesIn } from './web-sources.js'

// The only tools the agent has. The SDK ships Claude Code's tools (Bash,
// Read, Write...): on a server reachable from the internet they must not exist.
const TOOLS = ['WebSearch', 'WebFetch']

interface ClaudeAgentAssistantConfig {
    apiKey: string
    model: string
    // Empty directory the agent runs in, away from the backend's code and secrets.
    workDir: string
}

// Adapter: answers with the Claude Agent SDK, which runs the Claude Code
// agent loop in a child process.
class ClaudeAgentAssistant implements Assistant {
    private readonly options: Options

    constructor({apiKey, model, workDir}: ClaudeAgentAssistantConfig) {
        this.options = {
            model,
            systemPrompt: ELBER_SYSTEM_PROMPT,
            // `tools` decides which tools exist; `allowedTools` only
            // auto-approves them, and `dontAsk` denies anything else.
            tools: TOOLS,
            allowedTools: TOOLS,
            permissionMode: 'dontAsk',
            // Don't load ~/.claude or any CLAUDE.md: the agent must not pick
            // up the settings, memory or MCP servers of whoever runs the server.
            settingSources: [],
            // Claude Code's built-in skills (code review, debug...) are of no
            // use to Elber and only take up context.
            skills: [],
            cwd: workDir,
            // Replaces the child's environment: it gets only what it needs,
            // not the backend's other secrets.
            env: {
                PATH: process.env.PATH,
                HOME: process.env.HOME,
                ANTHROPIC_API_KEY: apiKey,
                CLAUDE_AGENT_SDK_CLIENT_APP: 'elber',
            },
            // Stream the text as it's written, not only complete messages.
            includePartialMessages: true,
            // Safety net against runaway tool loops.
            maxTurns: 10,
        }
    }

    async *reply({text, signal}: ReplyInput): AsyncGenerator<AssistantEvent> {
        const abortController = new AbortController()
        const abort = () => abortController.abort()
        signal.addEventListener('abort', abort, {once: true})

        const sources = new SourceList()
        let sentSources = 0
        // The whole answer, to know which sources it cites.
        let answer = ''

        try {
            const options = {...this.options, abortController, hooks: {PostToolUse: [citeSources(sources)]}}
            for await (const message of query({prompt: text, options})) {
                // A new text block after earlier text (e.g. after a search)
                // would be glued to it: toEvents separates them.
                for (const event of toEvents(message, answer !== '')) {
                    if (event.type === 'delta') answer += event.text
                    yield event
                }
                // New sources (added by the hook): send them before the text that cites them.
                if (sources.size > sentSources) {
                    sentSources = sources.size
                    yield {type: 'sources', sources: sources.all()}
                }
            }
            // The final list: only what the answer cites (a search returns many pages).
            if (sentSources > 0) yield {type: 'sources', sources: sources.citedIn(answer)}
        } finally {
            signal.removeEventListener('abort', abort)
        }
    }
}

// After each search or page read, numbers its sources and tells the model
// which number to cite each one with.
const citeSources = (sources: SourceList): HookCallbackMatcher => ({
    matcher: 'WebSearch|WebFetch',
    hooks: [async (input) => {
        if (input.hook_event_name !== 'PostToolUse') return {}
        const found = sources.add(sourcesIn(input.tool_name, input.tool_response))
        if (found.length === 0) return {}
        return {hookSpecificOutput: {hookEventName: 'PostToolUse', additionalContext: citationContext(found)}}
    }],
})

// Translates one SDK message into assistant events. Exported for tests.
export function* toEvents(message: SDKMessage, hasText: boolean): Generator<AssistantEvent> {
    switch (message.type) {
        case 'stream_event': {
            const {event} = message
            if (event.type === 'content_block_start' && event.content_block.type === 'text' && hasText) {
                yield {type: 'delta', text: '\n\n'}
            }
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield {type: 'delta', text: event.delta.text}
            }
            return
        }
        case 'assistant': {
            // Complete messages: their text already arrived as deltas, only
            // tool calls matter here (their input is complete by now).
            for (const block of message.message.content) {
                if (block.type === 'tool_use') {
                    yield {type: 'tool', name: block.name, detail: toolDetail(block.input)}
                }
            }
            return
        }
        case 'result': {
            if (message.subtype !== 'success') {
                throw new Error(`Agent stopped (${message.subtype}): ${message.errors.join('; ')}`)
            }
            if (message.is_error) {
                throw new Error(`Agent failed: ${message.result}`)
            }
            return
        }
    }
}

// WebSearch receives {query}, WebFetch {url, prompt}.
const toolDetail = (input: unknown): string | undefined => {
    if (typeof input !== 'object' || input === null) return undefined
    const {query, url} = input as {query?: unknown, url?: unknown}
    if (typeof query === 'string') return query
    if (typeof url === 'string') return url
    return undefined
}

export default ClaudeAgentAssistant
