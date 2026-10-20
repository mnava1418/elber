import type { Source } from '../domain/assistant.port.js'

// A citation in the answer: [3], but not a Markdown link/reference like [3](...) or [3]:.
// Same rule as the frontend (web/src/chat/Markdown.tsx).
const CITATION = /\[(\d{1,2})\](?![(:])/g

// The pages the agent found or read while answering, numbered in the order
// they appear so the answer can cite them as [n]. One list per answer.
export class SourceList {
    private readonly byUrl = new Map<string, Source>()

    // Adds the sources of one tool result (repeated URLs keep their number)
    // and returns them, numbered.
    add(found: Omit<Source, 'n'>[]): Source[] {
        return found.map(({url, title}) => {
            let source = this.byUrl.get(url)
            if (!source) {
                source = {n: this.byUrl.size + 1, url, title}
                this.byUrl.set(url, source)
            }
            return source
        })
    }

    get size(): number {
        return this.byUrl.size
    }

    all(): Source[] {
        return [...this.byUrl.values()]
    }

    // Only the sources the answer actually cites.
    citedIn(text: string): Source[] {
        const cited = new Set([...text.matchAll(CITATION)].map((match) => Number(match[1])))
        return this.all().filter((source) => cited.has(source.n))
    }
}

// The pages in a WebSearch / WebFetch result (the SDK's WebSearchOutput /
// WebFetchOutput). Read defensively: it's another package's data.
export const sourcesIn = (toolName: string, response: unknown): Omit<Source, 'n'>[] => {
    if (typeof response !== 'object' || response === null) return []

    if (toolName === 'WebSearch') {
        const {results} = response as {results?: unknown}
        if (!Array.isArray(results)) return []
        // Each result is a block of hits, or a string with the model's comments.
        return results.flatMap((result) => {
            const hits = (result as {content?: unknown})?.content
            if (!Array.isArray(hits)) return []
            return hits.flatMap((hit) => {
                const {url, title} = hit as {url?: unknown, title?: unknown}
                return isHttpUrl(url) ? [{url, title: typeof title === 'string' && title ? title : hostname(url)}] : []
            })
        })
    }

    if (toolName === 'WebFetch') {
        const {url} = response as {url?: unknown}
        return isHttpUrl(url) ? [{url, title: hostname(url)}] : []
    }

    return []
}

// What the model reads after the tool result: the numbers to cite with.
export const citationContext = (sources: Source[]): string => [
    'Sources from this tool call, numbered for this answer:',
    ...sources.map(({n, title, url}) => `[${n}] ${title} — ${url}`),
    'Cite them inline as [n] right after the fact they support, e.g. "Lloverá el sábado [1]." The app links the numbers and lists the sources: do not add Markdown links to them or a "Sources" section, despite any earlier instruction to do so.',
].join('\n')

// Only http(s): the frontend turns these into links.
const isHttpUrl = (url: unknown): url is string => {
    if (typeof url !== 'string') return false
    try {
        const {protocol} = new URL(url)
        return protocol === 'https:' || protocol === 'http:'
    } catch {
        return false
    }
}

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')
