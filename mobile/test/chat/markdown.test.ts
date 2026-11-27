import { citeNumber, decodeEntities, linkCitations, parseMarkdown } from '../../src/chat/markdown-parse'
import { stepsSummary } from '../../src/chat/steps'
import type { ToolStep } from '../../src/chat/types'

describe('linkCitations', () => {
  it('links [n] outside code and leaves real links alone', () => {
    expect(linkCitations('Lluvia [1]. Ver `a[2]` y [x](https://e.com) [3]: def')).toBe(
      'Lluvia [1](#cite-1). Ver `a[2]` y [x](https://e.com) [3]: def',
    )
    expect(citeNumber('#cite-12')).toBe(12)
    expect(citeNumber('https://e.com')).toBeNull()
  })
})

describe('parseMarkdown', () => {
  it('reads GFM tables, lists and code, dropping blank space', () => {
    const tokens = parseMarkdown('# Hola\n\n| A | B |\n| - | -: |\n| 1 | 2 |\n\n- uno\n- dos\n\n```ts\nconst a = 1\n```')
    expect(tokens.map((t) => t.type)).toEqual(['heading', 'table', 'list', 'code'])
    expect(tokens[1]).toMatchObject({ align: [null, 'right'] })
    expect(tokens[3]).toMatchObject({ lang: 'ts', text: 'const a = 1' })
  })

  it('turns citations into links', () => {
    const [p] = parseMarkdown('Llueve [1].')
    expect(p).toMatchObject({ type: 'paragraph', tokens: [{ type: 'text' }, { type: 'link', href: '#cite-1' }, { type: 'text' }] })
  })

  it('copes with an answer cut halfway', () => {
    expect(() => parseMarkdown('| A | B |\n| - |')).not.toThrow()
    expect(parseMarkdown('```js\nconst a')[0]).toMatchObject({ type: 'code' })
  })
})

describe('decodeEntities', () => {
  it('decodes what a browser would', () => {
    expect(decodeEntities('1 &lt; 2 &amp;&amp; &#39;a&#x27; &copy;')).toBe("1 < 2 && 'a' &copy;")
  })
})

describe('stepsSummary', () => {
  const step = (kind: ToolStep['kind']): ToolStep => ({ id: kind, kind, detail: '', status: 'done' })

  it('says what Elber did in one line', () => {
    expect(stepsSummary([step('search'), step('read')])).toBe('2 pasos · Buscó en la web y leyó 1 página')
    expect(stepsSummary([step('weather')])).toBe('1 paso · Consultó el clima')
    expect(stepsSummary([step('get_plans'), step('get_training_profile'), step('create_plan')])).toBe(
      '3 pasos · Revisó tu entrenamiento y guardó tu plan',
    )
  })
})
