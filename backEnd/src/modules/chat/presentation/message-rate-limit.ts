interface Options {
    // Answers per user per window.
    limit: number
    windowMs: number
    now?: () => number
}

// Fixed window per user, in memory: shared by all of a user's connections
// (tabs, reconnections), lost on restart. Enough for a single server.
export interface MessageRateLimit {
    // Uses up one answer. Returns 0 if allowed, else the seconds to wait.
    take(uid: string): number
}

export const createMessageRateLimit = ({limit, windowMs, now = Date.now}: Options): MessageRateLimit => {
    const windows = new Map<string, {startedAt: number, count: number}>()

    return {
        take(uid) {
            const time = now()
            // Drop finished windows so the map doesn't grow forever.
            for (const [key, window] of windows) {
                if (time - window.startedAt >= windowMs) windows.delete(key)
            }

            const window = windows.get(uid)
            if (!window) {
                windows.set(uid, {startedAt: time, count: 1})
                return 0
            }
            if (window.count < limit) {
                window.count++
                return 0
            }
            return Math.ceil((window.startedAt + windowMs - time) / 1000)
        },
    }
}
