// The parsing half of Markdown.tsx, kept apart so the tests don't load fonts.
// The web renders with react-markdown + remark-gfm; here marked's lexer reads
// the same GFM (tables, strikethrough, task lists) and Markdown.tsx draws its
// tokens with native views.
import { Lexer, type Token } from 'marked'

const CITE = /\[(\d{1,2})\](?![(:])/g

/** Turns "[1]" into a citation link, leaving code untouched (as the web does). */
export function linkCitations(md: string) {
  return md
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 ? part : part.replace(CITE, '[$1](#cite-$1)')))
    .join('')
}

/** The number of a citation link made by linkCitations, or null. */
export function citeNumber(href: string): number | null {
  const m = /^#cite-(\d+)$/.exec(href)
  return m ? Number(m[1]) : null
}

export function parseMarkdown(text: string): Token[] {
  return Lexer.lex(linkCitations(text), { gfm: true }).filter((t) => t.type !== 'space' && t.type !== 'def')
}

// marked leaves HTML entities as written (a browser decodes them); a native
// Text shows them literally, so the usual ones are decoded here.
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })
}
