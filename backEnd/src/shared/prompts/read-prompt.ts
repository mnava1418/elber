import { readFileSync } from 'node:fs'

// Prompts and guides for the model live in .md files, next to the code that
// uses them, because they are easier to read and edit than strings in code.
// Pass a URL relative to the caller: new URL('./prompts/x.md', import.meta.url).
// It works from src/ (tsx, vitest) and from dist/, where the build copies
// every .md. Read once at import time: a missing file fails at startup, not
// in the middle of an answer. Trimmed so the file's final newline doesn't
// reach the prompt.
export const readPrompt = (url: URL): string => readFileSync(url, 'utf8').trim()
