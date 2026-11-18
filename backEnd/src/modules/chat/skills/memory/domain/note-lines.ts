// Helpers for the notes Elber edits line by line (the profile, the to-dos, a
// note's related links): it changes only the lines it touches, so whatever
// the owner writes by hand stays as it is.

// The note after an edit. `changed` is false when there was nothing to do
// (the line was already there, or wasn't): the model is told so.
export interface NoteEdit {
    note: string
    changed: boolean
}

// Compares text the way a person would: ignoring case, spacing and a final period.
export const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().replace(/\.$/, '').toLowerCase()

// A list item is one line: text with line breaks would break the note.
export const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

export const linesOf = (note: string) => note === '' ? [] : note.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')

export const noteOf = (lines: string[]) => lines.length === 0 ? '' : lines.join('\n') + '\n'

const SECTION = /^##\s+(.+?)\s*$/
// A heading that ends a section: "#" or "##". Deeper ones ("###") belong to it.
const SECTION_END = /^#{1,2}\s/
const BULLET = /^\s*[-*+]\s/

// Adds "- item" under the "## Section" heading, after its last bullet so
// items keep the order they were added in. The section is created at the
// end of the note if it doesn't exist.
export const addToSection = (note: string, section: string, item: string): string => {
    const lines = linesOf(note)
    const bullet = `- ${oneLine(item)}`
    const start = lines.findIndex((line) => normalize(SECTION.exec(line)?.[1] ?? '') === normalize(section))
    if (start === -1) {
        while (lines.length > 0 && lines.at(-1)!.trim() === '') lines.pop()
        if (lines.length > 0) lines.push('')
        lines.push(`## ${oneLine(section)}`, bullet)
        return noteOf(lines)
    }

    const next = lines.findIndex((line, i) => i > start && SECTION_END.test(line))
    const end = next === -1 ? lines.length : next
    let at = start + 1
    for (let i = start + 1; i < end; i++) {
        if (BULLET.test(lines[i])) at = i + 1
    }
    lines.splice(at, 0, bullet)
    return noteOf(lines)
}
