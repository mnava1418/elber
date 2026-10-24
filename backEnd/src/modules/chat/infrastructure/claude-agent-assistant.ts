import { createSdkMcpServer, deleteSession, getSessionInfo, query, tool, type HookCallbackMatcher, type McpSdkServerConfigWithInstance, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { Skill, SkillContext, SkillTool, Widget } from '../../../shared/skills/skill.js'
import type { Assistant, AssistantEvent, ReplyInput } from '../domain/assistant.port.js'
import { systemPromptWith } from './elber-system-prompt.js'
import { citationContext, SourceList, sourcesIn } from './web-sources.js'

// The only tools the agent has. The SDK ships Claude Code's tools (Bash,
// Read, Write...): on a server reachable from the internet they must not exist.
const TOOLS = ['WebSearch', 'WebFetch']

// The skills' tools are served by an in-process MCP server with this name;
// the model sees them as mcp__elber__<name>.
const SKILLS_SERVER = 'elber'
const SKILL_PREFIX = `mcp__${SKILLS_SERVER}__`

interface ClaudeAgentAssistantConfig {
    apiKey: string
    model: string
    // Empty directory the agent runs in, away from the backend's code and secrets.
    workDir: string
    // Where the agent keeps its sessions (one .jsonl per conversation), apart
    // from the ~/.claude of whoever runs the server.
    configDir: string
    // Their tools, and what they know about the user (weather, memory...).
    skills: Skill[]
}

// Adapter: answers with the Claude Agent SDK, which runs the Claude Code
// agent loop in a child process.
class ClaudeAgentAssistant implements Assistant {
    private readonly options: Options
    private readonly workDir: string
    private readonly skills: Skill[]
    private readonly tools: SkillTool[]

    constructor({apiKey, model, workDir, configDir, skills}: ClaudeAgentAssistantConfig) {
        this.workDir = workDir
        this.skills = skills
        this.tools = skills.flatMap((skill) => skill.tools)
        // The agent (child process) gets it in `env` below; this process needs
        // it too: deleteSession() and getSessionInfo() run here and look for
        // sessions in this process's CLAUDE_CONFIG_DIR.
        process.env.CLAUDE_CONFIG_DIR = configDir
        this.options = {
            model,
            // `tools` decides which built-in tools exist; `allowedTools` only
            // auto-approves them (and the skills'), and `dontAsk` denies anything else.
            tools: TOOLS,
            allowedTools: [...TOOLS, ...this.tools.map((skillTool) => SKILL_PREFIX + skillTool.name)],
            permissionMode: 'dontAsk',
            // Only the MCP servers passed here, never one configured on the machine.
            strictMcpConfig: true,
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
                CLAUDE_CONFIG_DIR: configDir,
                ANTHROPIC_API_KEY: apiKey,
                CLAUDE_AGENT_SDK_CLIENT_APP: 'elber',
            },
            // Stream the text as it's written, not only complete messages.
            includePartialMessages: true,
            // Safety net against runaway tool loops.
            maxTurns: 10,
        }
    }

    async *reply({text, signal, sessionId, uid, locate}: ReplyInput): AsyncGenerator<AssistantEvent> {
        const abortController = new AbortController()
        const abort = () => abortController.abort()
        signal.addEventListener('abort', abort, {once: true})

        const sources = new SourceList()
        let sentSources = 0
        // Shown by tools as they run, sent between the SDK's messages.
        const widgets: Widget[] = []
        const show = (widget: Widget) => widgets.push(widget)
        // The whole answer, to know which sources it cites.
        let answer = ''

        try {
            const options: Options = {
                ...this.options,
                // Per answer: what the skills know about this user may have changed.
                systemPrompt: systemPromptWith(await contextsFor(this.skills, uid)),
                abortController,
                // The SDK reloads the conversation's history and sends it with the new message.
                resume: sessionId,
                hooks: {PostToolUse: [citeSources(sources)]},
                // One per answer: its tools run with this request's user and location.
                mcpServers: {[SKILLS_SERVER]: skillsServer(this.tools, {uid, signal, locate, show})},
            }
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
                for (const widget of widgets.splice(0)) yield {type: 'widget', widget}
            }
            // The final list: only what the answer cites (a search returns many pages).
            if (sentSources > 0) yield {type: 'sources', sources: sources.citedIn(answer)}
        } finally {
            signal.removeEventListener('abort', abort)
        }
    }

    async forget(sessionId: string): Promise<void> {
        // deleteSession throws a plain Error when the session doesn't exist:
        // checking first tells that case apart from real failures.
        const dir = this.workDir
        if (!(await getSessionInfo(sessionId, {dir}))) return
        await deleteSession(sessionId, {dir})
    }
}

// What the skills know about the user, for this answer's system prompt. A
// skill that fails to tell is left out: Elber still answers, knowing less.
// Exported for tests.
export const contextsFor = async (skills: Skill[], uid: string): Promise<string[]> => {
    const contexts = await Promise.all(skills.map(async (skill, i) => {
        try {
            return await skill.context?.(uid) ?? null
        } catch (error) {
            console.error(`Context of skill #${i} failed for ${uid}:`, error)
            return null
        }
    }))
    return contexts.filter((context) => context !== null)
}

// Serves the skills' tools to the agent. Their results go to the model as JSON.
const skillsServer = (tools: SkillTool[], context: SkillContext): McpSdkServerConfigWithInstance => createSdkMcpServer({
    name: SKILLS_SERVER,
    tools: tools.map((skillTool) => tool(skillTool.name, skillTool.description, skillTool.input, async (input) => {
        try {
            const result = await skillTool.run(input, context)
            return {content: [{type: 'text', text: JSON.stringify(result)}]}
        } catch (error) {
            console.error(`Tool ${skillTool.name} failed for ${context.uid}:`, error)
            // The model tells the user instead of the whole answer failing.
            return {content: [{type: 'text', text: 'The tool failed, try again later.'}], isError: true}
        }
    })),
})

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
        case 'system': {
            // The first message: says which session (conversation) this is.
            if (message.subtype === 'init') yield {type: 'session', id: message.session_id}
            return
        }
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
                    yield {type: 'tool', name: toolName(block.name), detail: toolDetail(block.input)}
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

// The skills' tools without the MCP prefix: the UI knows them as get_weather...
const toolName = (name: string) => name.startsWith(SKILL_PREFIX) ? name.slice(SKILL_PREFIX.length) : name

// WebSearch receives {query}, WebFetch {url, prompt}, get_weather {place?},
// remember {section, fact} and forget {fact}.
const toolDetail = (input: unknown): string | undefined => {
    if (typeof input !== 'object' || input === null) return undefined
    const {query, url, place, fact} = input as {query?: unknown, url?: unknown, place?: unknown, fact?: unknown}
    if (typeof query === 'string') return query
    if (typeof url === 'string') return url
    if (typeof place === 'string') return place
    if (typeof fact === 'string') return fact
    return undefined
}

export default ClaudeAgentAssistant
