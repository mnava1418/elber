import { readPrompt } from '../../../shared/prompts/read-prompt.js'

// The diary's agent: Elber as a reflective companion (prompts/diary.md). Kept
// stable (no dates or per-user data) so the API can cache it between requests.
export const DIARY_SYSTEM_PROMPT = readPrompt(new URL('./prompts/diary.md', import.meta.url))
