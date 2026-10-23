import { describe, expect, it } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { toEvents } from '../../../../src/modules/chat/infrastructure/claude-agent-assistant.js'

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
