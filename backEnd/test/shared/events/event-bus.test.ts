import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryEventBus } from '../../../src/shared/events/event-bus.js'

const EVENT = 'users.password_reset_requested'
const PAYLOAD = {email: 'user@example.com', resetLink: 'https://example.com/reset?oobCode=SECRET'}

// Handlers run asynchronously; wait until every pending one has finished.
const flushHandlers = () => new Promise((resolve) => setImmediate(resolve))

describe('InMemoryEventBus', () => {
    let bus: InMemoryEventBus
    let consoleError: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        bus = new InMemoryEventBus()
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('delivers the payload to a subscribed handler', async () => {
        const handler = vi.fn()
        bus.subscribe(EVENT, handler)

        bus.publish(EVENT, PAYLOAD)
        await flushHandlers()

        expect(handler).toHaveBeenCalledExactlyOnceWith(PAYLOAD)
    })

    it('delivers to every handler of the event', async () => {
        const first = vi.fn()
        const second = vi.fn()
        bus.subscribe(EVENT, first)
        bus.subscribe(EVENT, second)

        bus.publish(EVENT, PAYLOAD)
        await flushHandlers()

        expect(first).toHaveBeenCalledOnce()
        expect(second).toHaveBeenCalledOnce()
    })

    it('returns from publish before handlers run (fire-and-forget)', async () => {
        const handler = vi.fn()
        bus.subscribe(EVENT, handler)

        bus.publish(EVENT, PAYLOAD)

        expect(handler).not.toHaveBeenCalled()
        await flushHandlers()
        expect(handler).toHaveBeenCalledOnce()
    })

    it('does nothing when the event has no handlers', () => {
        expect(() => bus.publish(EVENT, PAYLOAD)).not.toThrow()
    })

    it('keeps running the other handlers when one rejects', async () => {
        const failing = vi.fn().mockRejectedValue(new Error('boom'))
        const healthy = vi.fn()
        bus.subscribe(EVENT, failing)
        bus.subscribe(EVENT, healthy)

        bus.publish(EVENT, PAYLOAD)
        await flushHandlers()

        expect(healthy).toHaveBeenCalledOnce()
    })

    it('also isolates handlers that throw synchronously', async () => {
        const failing = vi.fn(() => {
            throw new Error('sync boom')
        })
        const healthy = vi.fn()
        bus.subscribe(EVENT, failing)
        bus.subscribe(EVENT, healthy)

        expect(() => bus.publish(EVENT, PAYLOAD)).not.toThrow()
        await flushHandlers()

        expect(healthy).toHaveBeenCalledOnce()
    })

    it('logs a failed handler with the event name but never the payload', async () => {
        const error = new Error('boom')
        bus.subscribe(EVENT, vi.fn().mockRejectedValue(error))

        bus.publish(EVENT, PAYLOAD)
        await flushHandlers()

        expect(consoleError).toHaveBeenCalledExactlyOnceWith(`Handler for "${EVENT}" failed:`, error)
        expect(JSON.stringify(consoleError.mock.calls)).not.toContain('SECRET')
    })
})
