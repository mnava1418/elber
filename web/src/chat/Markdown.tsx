import { Children, isValidElement, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Source } from './types'
import { CopyIcon, CheckIcon } from './icons'

const CITE = /\[(\d{1,2})\](?![(:])/g

/** Convierte "[1]" en un link de cita, sin tocar código. */
function linkCitations(md: string) {
  return md
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 ? part : part.replace(CITE, '[$1](#cite-$1)')))
    .join('')
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const child = Children.toArray(children)[0]
  const props = isValidElement<{ className?: string; children?: ReactNode }>(child) ? child.props : {}
  const lang = /language-([\w+-]+)/.exec(props.className ?? '')?.[1] ?? 'texto'
  const code = String(props.children ?? '').replace(/\n$/, '')

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="md-code">
      <div className="md-code-bar">
        <span>{lang}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  )
}

interface MarkdownProps {
  text: string
  sources: Source[]
  state?: 'streaming' | 'stopped'
}

export function Markdown({ text, sources, state }: MarkdownProps) {
  const components: Components = {
    a({ href = '', children }) {
      const cite = /^#cite-(\d+)$/.exec(href)
      if (cite) {
        const s = sources.find((x) => x.n === Number(cite[1]))
        return (
          <a className="md-cite" href={s?.url ?? '#'} target="_blank" rel="noreferrer" title={s?.title} aria-label={`Fuente ${cite[1]}`}>
            {cite[1]}
          </a>
        )
      }
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    },
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    table: ({ children }) => (
      <div className="md-table">
        <table>{children}</table>
      </div>
    ),
  }

  return (
    <div className={`md${state ? ` md--${state}` : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  )
}
