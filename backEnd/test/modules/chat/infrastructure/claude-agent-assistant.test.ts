import { describe, expect, it, vi } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { Skill } from '../../../../src/modules/chat/domain/skill.js'
import { contextsFor, toEvents } from '../../../../src/modules/chat/infrastructure/claude-agent-assistant.js'
import { ELBER_SYSTEM_PROMPT, systemPromptWith, todayContext } from '../../../../src/modules/chat/infrastructure/elber-system-prompt.js'

// Builds SDK messages with only the fields toEvents reads.
const sdkMessage = (message: object) => message as SDKMessage
const streamEvent = (event: object) => sdkMessage({type: 'stream_event', event})

const events = (message: SDKMessage, hasText = false) => [...toEvents(message, hasText)]

describe('toEvents', () => {
    it('turns text deltas into delta events', () => {
        const message = streamEvent({type: 'content_block_delta', index: 0, delta: {type: 'text_delta', text: 'Hola'}})

        expect(events(message)).toEqual([{type: 'delta', text: 'Hola'}])
    })

    it('ignores deltas that are not text (tool input, thinking)', () => {
        const message = streamEvent({type: 'content_block_delta', index: 0, delta: {type: 'input_json_delta', partial_json: '{"q'}})

        expect(events(message)).toEqual([])
    })

    it('separates a new text block from earlier text', () => {
        const message = streamEvent({type: 'content_block_start', index: 2, content_block: {type: 'text', text: ''}})

        expect(events(message, true)).toEqual([{type: 'delta', text: '\n\n'}])
        expect(events(message, false)).toEqual([])
    })

    it('turns tool calls of complete messages into tool events with a hint', () => {
        const message = sdkMessage({
            type: 'assistant',
            message: {
                content: [
                    {type: 'text', text: 'Busco…'},
                    {type: 'tool_use', id: 't1', name: 'WebSearch', input: {query: 'clima CDMX'}},
                    {type: 'tool_use', id: 't2', name: 'WebFetch', input: {url: 'https://example.com', prompt: 'resume'}},
                ],
            },
        })

        expect(events(message)).toEqual([
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'tool', name: 'WebFetch', detail: 'https://example.com'},
        ])
    })

    it('names the skills\' tools without their MCP prefix, with the place as hint', () => {
        const message = sdkMessage({
            type: 'assistant',
            message: {
                content: [
                    {type: 'tool_use', id: 't1', name: 'mcp__elber__get_weather', input: {place: 'Madrid'}},
                    {type: 'tool_use', id: 't2', name: 'mcp__elber__get_weather', input: {}},
                ],
            },
        })

        expect(events(message)).toEqual([
            {type: 'tool', name: 'get_weather', detail: 'Madrid'},
            {type: 'tool', name: 'get_weather', detail: undefined},
        ])
    })

    it('gives the fact as hint for the memory tools', () => {
        const message = sdkMessage({
            type: 'assistant',
            message: {
                content: [
                    {type: 'tool_use', id: 't1', name: 'mcp__elber__remember', input: {section: 'Gustos', fact: 'El café de olla'}},
                    {type: 'tool_use', id: 't2', name: 'mcp__elber__forget', input: {fact: 'El té'}},
                ],
            },
        })

        expect(events(message)).toEqual([
            {type: 'tool', name: 'remember', detail: 'El café de olla'},
            {type: 'tool', name: 'forget', detail: 'El té'},
        ])
    })

    it('gives the task as hint for the to-do tools', () => {
        const message = sdkMessage({
            type: 'assistant',
            message: {
                content: [
                    {type: 'tool_use', id: 't1', name: 'mcp__elber__add_todo', input: {task: 'Hablarle a mi familia', due: '2026-10-31'}},
                    {type: 'tool_use', id: 't2', name: 'mcp__elber__list_todos', input: {}},
                ],
            },
        })

        expect(events(message)).toEqual([
            {type: 'tool', name: 'add_todo', detail: 'Hablarle a mi familia'},
            {type: 'tool', name: 'list_todos', detail: undefined},
        ])
    })

    it('gives the title (or the two notes) as hint for the note tools', () => {
        const message = sdkMessage({
            type: 'assistant',
            message: {
                content: [
                    {type: 'tool_use', id: 't1', name: 'mcp__elber__save_note', input: {title: 'Skill de finanzas', type: 'idea', content: 'Texto'}},
                    {type: 'tool_use', id: 't2', name: 'mcp__elber__search_notes', input: {query: 'finanzas'}},
                    {type: 'tool_use', id: 't3', name: 'mcp__elber__link_notes', input: {from: 'Skill de finanzas', to: 'Elber'}},
                ],
            },
        })

        expect(events(message)).toEqual([
            {type: 'tool', name: 'save_note', detail: 'Skill de finanzas'},
            {type: 'tool', name: 'search_notes', detail: 'finanzas'},
            {type: 'tool', name: 'link_notes', detail: 'Skill de finanzas → Elber'},
        ])
    })

    it('ends quietly on a successful result', () => {
        const message = sdkMessage({type: 'result', subtype: 'success', is_error: false, result: 'Hola'})

        expect(events(message)).toEqual([])
    })

    it('throws on a successful result flagged as error (e.g. invalid API key)', () => {
        const message = sdkMessage({type: 'result', subtype: 'success', is_error: true, result: 'Invalid API key'})

        expect(() => events(message)).toThrow('Invalid API key')
    })

    it('throws on an error result', () => {
        const message = sdkMessage({type: 'result', subtype: 'error_max_turns', is_error: true, errors: ['too many turns']})

        expect(() => events(message)).toThrow('error_max_turns')
    })

    it('turns the init message into a session event', () => {
        const message = sdkMessage({type: 'system', subtype: 'init', session_id: 'session-1'})

        expect(events(message)).toEqual([{type: 'session', id: 'session-1'}])
    })

    it('ignores other messages (other system messages, user tool results...)', () => {
        expect(events(sdkMessage({type: 'system', subtype: 'status', session_id: 'session-1'}))).toEqual([])
        expect(events(sdkMessage({type: 'user', message: {content: []}}))).toEqual([])
    })
})

describe('contextsFor', () => {
    it("gives what each skill knows about the user, leaving out the ones with nothing", async () => {
        const profile = vi.fn<NonNullable<Skill['context']>>(async () => 'The profile')
        const skills: Skill[] = [
            {tools: []},
            {tools: [], context: profile},
            {tools: [], context: async () => null},
        ]

        expect(await contextsFor(skills, 'user-1')).toEqual(['The profile'])
        expect(profile).toHaveBeenCalledExactlyOnceWith('user-1')
    })

    it('leaves out a skill that fails, so Elber still answers', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const skills: Skill[] = [
            {tools: [], context: async () => { throw new Error('vault missing') }},
            {tools: [], context: async () => 'The profile'},
        ]

        expect(await contextsFor(skills, 'user-1')).toEqual(['The profile'])
    })
})

describe('systemPromptWith', () => {
    it("keeps the section's fixed prompt first, so it stays cached", () => {
        expect(systemPromptWith(ELBER_SYSTEM_PROMPT, [])).toBe(ELBER_SYSTEM_PROMPT)
        expect(systemPromptWith(ELBER_SYSTEM_PROMPT, ['The profile'])).toBe(`${ELBER_SYSTEM_PROMPT}\n\nThe profile`)
    })
})

describe('todayContext', () => {
    it('gives the local date, with its weekday and in ISO form', () => {
        // Local time: late at night it must not jump to the next day (UTC).
        expect(todayContext(new Date(2026, 9, 31, 23, 30))).toBe('Today is Saturday, October 31, 2026 (2026-10-31).')
    })
})
