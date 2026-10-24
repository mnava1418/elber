// Helpers for the notes Elber edits line by line (the profile, the to-dos):
// it changes only the lines it touches, so whatever the owner writes by hand
// stays as it is.

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
