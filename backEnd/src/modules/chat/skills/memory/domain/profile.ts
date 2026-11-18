// What Elber knows about its owner: a note in the vault the owner can also
// edit in Obsidian. Facts are bullets under "## Section" headings:
//
//   ## Sobre mí
//   - Vive en CDMX
//
// The edits below change only the lines they touch, so anything else the
// owner writes in the note (paragraphs, other headings...) stays as it is.

import { addToSection, linesOf, normalize, noteOf, type NoteEdit } from './note-lines.js'

const BULLET = /^\s*[-*+]\s+(.+?)\s*$/

const isFact = (line: string, fact: string) => {
    const match = BULLET.exec(line)
    return match !== null && normalize(match[1]) === normalize(fact)
}

// Files the fact under the section, creating the section at the end of the
// note if it doesn't exist. A fact already in the note (in any section) isn't
// added twice.
export const addFact = (note: string, section: string, fact: string): NoteEdit => {
    if (linesOf(note).some((line) => isFact(line, fact))) return {note, changed: false}
    return {note: addToSection(note, section, fact), changed: true}
}

// Removes the fact wherever it is. The model quotes it from the profile it
// was given, so matching is exact apart from case and spacing.
export const removeFact = (note: string, fact: string): NoteEdit => {
    const lines = linesOf(note)
    const kept = lines.filter((line) => !isFact(line, fact))
    return kept.length === lines.length ? {note, changed: false} : {note: noteOf(kept), changed: true}
}
