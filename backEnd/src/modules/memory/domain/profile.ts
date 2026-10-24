// What Elber knows about its owner: a note in the vault the owner can also
// edit in Obsidian. Facts are bullets under "## Section" headings:
//
//   ## Sobre mí
//   - Vive en CDMX
//
// The edits below change only the lines they touch, so anything else the
// owner writes in the note (paragraphs, other headings...) stays as it is.

import { linesOf, normalize, noteOf, oneLine, type NoteEdit } from './note-lines.js'

const SECTION = /^##\s+(.+?)\s*$/
// A heading that ends a section: "#" or "##". Deeper ones ("###") belong to it.
const SECTION_END = /^#{1,2}\s/
const BULLET = /^\s*[-*+]\s+(.+?)\s*$/

const isFact = (line: string, fact: string) => {
    const match = BULLET.exec(line)
    return match !== null && normalize(match[1]) === normalize(fact)
}

// Files the fact under the section, creating the section at the end of the
// note if it doesn't exist. A fact already in the note (in any section) isn't
// added twice.
export const addFact = (note: string, section: string, fact: string): NoteEdit => {
    const lines = linesOf(note)
    if (lines.some((line) => isFact(line, fact))) return {note, changed: false}

    const bullet = `- ${oneLine(fact)}`
    const start = lines.findIndex((line) => normalize(SECTION.exec(line)?.[1] ?? '') === normalize(section))
    if (start === -1) {
        while (lines.length > 0 && lines.at(-1)!.trim() === '') lines.pop()
        if (lines.length > 0) lines.push('')
        lines.push(`## ${oneLine(section)}`, bullet)
        return {note: noteOf(lines), changed: true}
    }

    const next = lines.findIndex((line, i) => i > start && SECTION_END.test(line))
    const end = next === -1 ? lines.length : next
    // After the section's last bullet, so facts keep the order they were learned in.
    let at = start + 1
    for (let i = start + 1; i < end; i++) {
        if (BULLET.test(lines[i])) at = i + 1
    }
    lines.splice(at, 0, bullet)
    return {note: noteOf(lines), changed: true}
}

// Removes the fact wherever it is. The model quotes it from the profile it
// was given, so matching is exact apart from case and spacing.
export const removeFact = (note: string, fact: string): NoteEdit => {
    const lines = linesOf(note)
    const kept = lines.filter((line) => !isFact(line, fact))
    return kept.length === lines.length ? {note, changed: false} : {note: noteOf(kept), changed: true}
}
