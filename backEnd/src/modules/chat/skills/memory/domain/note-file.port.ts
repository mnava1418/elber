// Port: one note Elber keeps (the profile, the to-dos). The Obsidian vault is
// an adapter in infrastructure/ implementing it.
export interface NoteFile {
    // The note's Markdown; empty when it doesn't exist yet.
    read(): Promise<string>
    // Creates the note when it doesn't exist yet.
    write(note: string): Promise<void>
}
