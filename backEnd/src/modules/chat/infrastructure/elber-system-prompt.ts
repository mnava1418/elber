import { localIsoDate } from '../../../shared/dates/local-date.js'
import { readPrompt } from '../../../shared/prompts/read-prompt.js'

// Elber's personality and rules (prompts/elber.md). Kept stable (no dates or
// per-user data) so the API can cache it between requests.
export const ELBER_SYSTEM_PROMPT = readPrompt(new URL('./prompts/elber.md', import.meta.url))

// The section's fixed prompt first, then what the skills know about this
// user (their profile...): only the end changes between users or answers, so
// the start stays cached.
export const systemPromptWith = (prompt: string, contexts: string[]): string => [prompt, ...contexts].join('\n\n')

// The model doesn't know what day it is, and needs it to turn "this
// Saturday" into a date. In the server's timezone: Elber runs on the user's
// machine. It goes after the other contexts because it changes every day.
export const todayContext = (now = new Date()): string => {
    const weekday = now.toLocaleDateString('en-US', {weekday: 'long'})
    const day = now.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
    return `Today is ${weekday}, ${day} (${localIsoDate(now)}).`
}

// For messages said in a call (prompts/voice.md): the answer is read aloud,
// a sentence at a time. Last, after the date, because only some answers have
// it.
export const VOICE_CONTEXT = readPrompt(new URL('./prompts/voice.md', import.meta.url))
