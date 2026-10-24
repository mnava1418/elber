// Port: where the profile note lives. The Obsidian vault is an adapter in
// infrastructure/ implementing it.
export interface ProfileStore {
    // The note's Markdown; empty when it doesn't exist yet.
    read(): Promise<string>
    // Creates the note when it doesn't exist yet.
    write(note: string): Promise<void>
}
