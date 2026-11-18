// Port: where the diary is kept, a text per month (YYYY-MM). An adapter in
// infrastructure/ implements it (Obsidian...).
export interface JournalStore {
    // '' when the month has no entries yet.
    readMonth(month: string): Promise<string>
    writeMonth(month: string, text: string): Promise<void>
    // The months with a diary, oldest first.
    listMonths(): Promise<string[]>
}
