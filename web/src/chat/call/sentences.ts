// Elber starts talking before the answer is finished: the streamed text is
// cut into sentences as they complete, and each piece goes to Polly.

// The backend's limit per piece (MAX_SPEECH_CHARS), with room to spare.
const MAX_PIECE = 900
// Shorter sentences wait for the next one: fewer requests, and a more
// natural flow than a pause after every "¡Claro!".
const MIN_PIECE = 40

// End of a sentence: punctuation followed by a space (not "3.5" or a URL),
// or a line break (list items, headings).
const BOUNDARY = /[.!?…]+["'”»)\]]*(?=\s)|\n/g

/** Markdown, citations and links read aloud would be noise ("asterisco", "corchete uno"). */
export function speakable(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s*\[\d+\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/, '')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/, '')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/\*\*|__|~~|(?<!\w)[*_]|[*_](?!\w)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
}

// Long sentences cut at a space, to fit the backend's limit.
function fit(text: string): string[] {
  const pieces: string[] = []
  let rest = text
  while (rest.length > MAX_PIECE) {
    const cut = rest.lastIndexOf(' ', MAX_PIECE)
    const at = cut > 0 ? cut : MAX_PIECE
    pieces.push(rest.slice(0, at))
    rest = rest.slice(at).trimStart()
  }
  if (rest) pieces.push(rest)
  return pieces
}

/** Cuts one answer, fed as it grows, into pieces ready to speak. */
export class SentenceSplitter {
  // How much of the answer was already cut.
  private consumed = 0
  // Clean text too short to send yet.
  private carry = ''
  // Code blocks aren't read aloud.
  private inCode = false

  /** `text` is the whole answer so far; `final` once it is complete. */
  push(text: string, final: boolean): string[] {
    const pending = text.slice(this.consumed)
    const sentences: string[] = []
    let start = 0
    for (const match of pending.matchAll(BOUNDARY)) {
      const end = match.index + match[0].length
      sentences.push(pending.slice(start, end))
      start = end
    }
    if (final) {
      sentences.push(pending.slice(start))
      start = pending.length
    }
    this.consumed += start

    const pieces: string[] = []
    for (const sentence of sentences) {
      if (/^\s*```/.test(sentence)) {
        this.inCode = !this.inCode
        continue
      }
      if (this.inCode) continue
      let clean = speakable(sentence)
      if (!clean) continue
      // List items and headings have no period: without one Polly runs them together.
      if (!/[.!?…:;,]$/.test(clean)) clean += '.'
      this.carry = this.carry ? `${this.carry} ${clean}` : clean
      if (this.carry.length >= MIN_PIECE) {
        pieces.push(...fit(this.carry))
        this.carry = ''
      }
    }
    if (final && this.carry) {
      pieces.push(...fit(this.carry))
      this.carry = ''
    }
    return pieces
  }
}
