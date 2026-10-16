import { AppEvents, EventName } from './events.js'

export type EventHandler<E extends EventName> = (payload: AppEvents[E]) => Promise<void> | void

// Modules depend on this interface, not on the implementation, so the
// in-memory bus can be swapped for a queue (BullMQ, Pub/Sub...) later.
export interface EventBus {
    publish<E extends EventName>(event: E, payload: AppEvents[E]): void
    subscribe<E extends EventName>(event: E, handler: EventHandler<E>): void
}

type AnyHandler = (payload: unknown) => Promise<void> | void

// In-process bus: fire-and-forget. publish() returns immediately and handlers
// run afterwards, so a slow or failing handler never affects the publisher.
// Events are lost if the process dies before handlers finish.
export class InMemoryEventBus implements EventBus {
    private readonly handlers = new Map<EventName, AnyHandler[]>()

    publish = <E extends EventName>(event: E, payload: AppEvents[E]) => {
        for (const handler of this.handlers.get(event) ?? []) {
            Promise.resolve()
                .then(() => handler(payload))
                // Log the event name only: payloads may carry secrets.
                .catch((error) => console.error(`Handler for "${event}" failed:`, error))
        }
    }

    subscribe = <E extends EventName>(event: E, handler: EventHandler<E>) => {
        const handlers = this.handlers.get(event) ?? []
        handlers.push(handler as AnyHandler)
        this.handlers.set(event, handlers)
    }
}
