import { serial } from '../../../../../shared/async/serial.js'
import { weekdayOf } from '../../../../../shared/dates/journal-day.js'
import { DAY, formatEntry, monthOf, upsertEntry, type Entry } from '../domain/entries.js'
import type { JournalStore } from '../domain/journal-store.port.js'

export type SaveEntryInput = Omit<Entry, 'date'>

// The model reads these and reacts. NOT_A_DIARY_DAY: the conversation isn't
// a diary day, so there is no day to save the entry in.
type Unavailable = {error: 'JOURNAL_UNAVAILABLE'}
export type SaveEntryResult = {saved: true, date: string} | {error: 'NOT_A_DIARY_DAY'} | Unavailable
export type ReadMonthResult = {month: string, entries: string} | {error: 'NO_ENTRIES', month: string} | Unavailable
export type ListMonthsResult = {months: string[]} | Unavailable

// The diary of the vault's owner. Nobody else has one: the vault is theirs.
class ManageJournalUseCase {
    // Two saves of the same month would otherwise drop each other's entry.
    private readonly queue = serial()

    constructor(private readonly store: JournalStore, private readonly ownerUid: string) {}

    // `date` is the conversation's day, never chosen by the model. Saving the
    // same day again replaces its entry.
    saveEntry = async (input: SaveEntryInput, date: string, uid: string): Promise<SaveEntryResult> => {
        if (uid !== this.ownerUid) return {error: 'JOURNAL_UNAVAILABLE'}
        if (!DAY.test(date)) return {error: 'NOT_A_DIARY_DAY'}
        const entry = formatEntry({...input, date}, weekdayOf(date))
        const month = monthOf(date)
        await this.queue(async () => {
            await this.store.writeMonth(month, upsertEntry(await this.store.readMonth(month), date, entry))
        })
        return {saved: true, date}
    }

    readMonth = async (month: string, uid: string): Promise<ReadMonthResult> => {
        if (uid !== this.ownerUid) return {error: 'JOURNAL_UNAVAILABLE'}
        const entries = (await this.store.readMonth(month)).trim()
        return entries ? {month, entries} : {error: 'NO_ENTRIES', month}
    }

    listMonths = async (uid: string): Promise<ListMonthsResult> => {
        if (uid !== this.ownerUid) return {error: 'JOURNAL_UNAVAILABLE'}
        return {months: await this.store.listMonths()}
    }
}

export default ManageJournalUseCase
