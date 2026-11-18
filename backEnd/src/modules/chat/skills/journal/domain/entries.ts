// A month of the diary is one Markdown file, an entry per day:
//
//   ## 2026-11-02 (lunes)
//
//   Hoy por fin terminé...
//
//   **Ánimo:** contento, cansado
//   **Temas:** Elber, trabajo
//   **Personas:** mi mamá

// YYYY-MM-DD and YYYY-MM.
export const DAY = /^\d{4}-\d{2}-\d{2}$/
export const MONTH = /^\d{4}-\d{2}$/

export interface Entry {
    date: string
    // In first person, in the user's words.
    summary: string
    mood: string[]
    topics: string[]
    people: string[]
}

export const monthOf = (date: string): string => date.slice(0, 7)

// What the analysis will look for, as one line each. Left out when empty.
const LISTS = [['Ánimo', 'mood'], ['Temas', 'topics'], ['Personas', 'people']] as const

// `weekday` comes from outside: the domain doesn't deal with locales.
export const formatEntry = (entry: Entry, weekday: string): string => {
    const lists = LISTS
        .filter(([, field]) => entry[field].length > 0)
        .map(([label, field]) => `**${label}:** ${entry[field].join(', ')}`)
    return [`## ${entry.date} (${weekday})`, entry.summary.trim(), lists.join('\n')].filter(Boolean).join('\n\n')
}

// Only a dated heading starts an entry, so the owner's own headings (in
// Obsidian) stay inside the entry they wrote them in.
const HEADING = /^## (\d{4}-\d{2}-\d{2})\b/

// The month with the day's entry: replacing the one it had, or inserted in
// date order. Whatever comes before the first entry is kept on top.
export const upsertEntry = (month: string, date: string, entry: string): string => {
    const preamble: string[] = []
    const entries: {date: string, lines: string[]}[] = []
    for (const line of month.split('\n')) {
        const heading = HEADING.exec(line)
        if (heading) entries.push({date: heading[1]!, lines: [line]})
        else (entries.at(-1)?.lines ?? preamble).push(line)
    }

    const others = entries.filter((existing) => existing.date !== date)
    const all = [...others.map((existing) => ({date: existing.date, text: existing.lines.join('\n').trim()})), {date, text: entry}]
        .sort((a, b) => a.date.localeCompare(b.date))
    return [preamble.join('\n').trim(), ...all.map((existing) => existing.text)].filter(Boolean).join('\n\n') + '\n'
}
