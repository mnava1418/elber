import * as Clipboard from 'expo-clipboard'
import type { Token, Tokens } from 'marked'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native'
import { Text } from '../components'
import { CheckIcon, CopyIcon } from '../components/icons'
import { brand, chatColors, colors, fonts } from '../theme'
import { citeNumber, decodeEntities, parseMarkdown } from './markdown-parse'
import type { Source } from './types'

// Elber's answers in Markdown (web/src/chat/Markdown.tsx and .md in Chat.css),
// drawn with native views: React Native has no HTML, so each token of marked's
// lexer becomes a View (blocks) or a nested Text (inline).

const SIZE = 15.5
const LINE = 26

const open = (url: string) => void Linking.openURL(url).catch(() => {})

interface Ctx {
  sources: Source[]
}

// Inline tokens, always inside a Text: nested Texts inherit its font and color.
function inline(tokens: Token[] | undefined, ctx: Ctx, key = ''): ReactNode {
  return tokens?.map((t, i) => {
    const k = `${key}${i}`
    switch (t.type) {
      case 'strong':
        return (
          <RNText key={k} style={styles.strong}>
            {inline(t.tokens, ctx, k)}
          </RNText>
        )
      case 'em':
        return (
          <RNText key={k} style={styles.em}>
            {inline(t.tokens, ctx, k)}
          </RNText>
        )
      case 'del':
        return (
          <RNText key={k} style={styles.del}>
            {inline(t.tokens, ctx, k)}
          </RNText>
        )
      case 'codespan':
        return (
          <RNText key={k} style={styles.codespan}>
            {` ${decodeEntities(t.text)} `}
          </RNText>
        )
      case 'br':
        return '\n'
      case 'link': {
        const n = citeNumber(t.href)
        if (n !== null) {
          const source = ctx.sources.find((s) => s.n === n)
          return (
            <Fragment key={k}>
              {' '}
              <RNText
                style={styles.cite}
                onPress={source ? () => open(source.url) : undefined}
                accessibilityRole="link"
                accessibilityLabel={`Fuente ${n}`}
              >
                {` ${n} `}
              </RNText>
            </Fragment>
          )
        }
        return (
          <RNText key={k} style={styles.link} onPress={() => open(t.href)} accessibilityRole="link">
            {inline(t.tokens, ctx, k)}
          </RNText>
        )
      }
      case 'image':
        // Images stay a link to them, like a source.
        return (
          <RNText key={k} style={styles.link} onPress={() => open(t.href)} accessibilityRole="link">
            {t.text || t.href}
          </RNText>
        )
      case 'text':
        return 'tokens' in t && t.tokens ? <Fragment key={k}>{inline(t.tokens, ctx, k)}</Fragment> : decodeEntities(t.text)
      case 'escape':
      case 'html':
        return decodeEntities(t.text)
      default:
        return 'text' in t ? decodeEntities(String(t.text)) : null
    }
  })
}

// While streaming, a cursor follows the last line; a stopped answer dims its
// last block, the one that was cut.
interface Tail {
  cursor: boolean
  dim: boolean
}
const NO_TAIL: Tail = { cursor: false, dim: false }

function Cursor() {
  return <RNText style={styles.cursor}>{' ▍'}</RNText>
}

function Paragraph({ tokens, ctx, tail, style }: { tokens?: Token[]; ctx: Ctx; tail: Tail; style?: object }) {
  return (
    <Text size={SIZE} color={tail.dim ? chatColors.inkStopped : chatColors.ink} style={[styles.paragraph, style]}>
      {inline(tokens, ctx)}
      {tail.cursor && <Cursor />}
    </Text>
  )
}

const HEADING_SIZE: Record<number, number> = { 1: 21, 2: 19, 3: 17 }

function CodeBlock({ token }: { token: Tokens.Code }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <View style={styles.code}>
      <View style={styles.codeBar}>
        <Text font="mono" size={12}>
          {token.lang?.split(/\s/)[0] || 'texto'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copiar el código"
          onPress={() => void Clipboard.setStringAsync(token.text).then(() => setCopied(true))}
          style={({ pressed }) => [styles.codeCopy, pressed && styles.pressedBg]}
          hitSlop={6}
        >
          {copied ? <CheckIcon color={colors.text} /> : <CopyIcon color={colors.text} />}
          <Text font="medium" size={12.5} accessibilityLiveRegion="polite">
            {copied ? 'Copiado' : 'Copiar'}
          </Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.codeScroll}>
        <RNText style={styles.codeText}>{token.text}</RNText>
      </ScrollView>
    </View>
  )
}

const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

// A table is laid out by columns, each as wide as its widest cell. Cells keep
// to one line, like the web's (white-space: nowrap), so rows line up across
// columns, and the table scrolls sideways when it doesn't fit.
function Table({ token, ctx }: { token: Tokens.Table; ctx: Ctx }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.table} contentContainerStyle={styles.tableRow}>
      {token.header.map((head, c) => {
        const align = token.align[c]
        const alignItems = align ? ALIGN[align] : 'flex-start'
        return (
          <View key={c} style={styles.column}>
            <View style={[styles.cell, styles.headCell, { alignItems }]}>
              <Text font="semibold" size={12} numberOfLines={1} style={styles.headText}>
                {inline(head.tokens, ctx)}
              </Text>
            </View>
            {token.rows.map((row, r) => (
              <View key={r} style={[styles.cell, styles.bodyCell, { alignItems }]}>
                <Text size={14} numberOfLines={1} color={c === 0 ? chatColors.inkStrong : chatColors.ink} style={styles.cellText}>
                  {inline(row[c]?.tokens, ctx)}
                </Text>
              </View>
            ))}
          </View>
        )
      })}
    </ScrollView>
  )
}

function List({ token, ctx, tail }: { token: Tokens.List; ctx: Ctx; tail: Tail }) {
  const start = typeof token.start === 'number' ? token.start : 1
  return (
    <View style={styles.list}>
      {token.items.map((item, i) => {
        const marker = item.task ? (item.checked ? '☑' : '☐') : token.ordered ? `${start + i}.` : '•'
        const last = i === token.items.length - 1
        return (
          <View key={i} style={styles.item}>
            <Text size={SIZE} color={brand.cyan} style={[styles.marker, token.ordered && styles.markerNumber]}>
              {marker}
            </Text>
            <View style={styles.itemBody}>
              <Blocks tokens={item.tokens.filter((t) => t.type !== 'checkbox')} ctx={ctx} tail={last ? tail : NO_TAIL} gap={6} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

function Block({ token, ctx, tail }: { token: Token; ctx: Ctx; tail: Tail }): ReactNode {
  switch (token.type) {
    case 'paragraph':
      return <Paragraph tokens={token.tokens} ctx={ctx} tail={tail} />
    // The text of a tight list item.
    case 'text':
      return <Paragraph tokens={token.tokens ?? [{ type: 'text', raw: token.raw, text: token.text }]} ctx={ctx} tail={tail} />
    case 'heading': {
      const size = HEADING_SIZE[token.depth] ?? SIZE
      return (
        <Text
          font="display"
          size={size}
          color={tail.dim ? chatColors.inkStopped : chatColors.inkStrong}
          style={[styles.heading, { lineHeight: Math.round(size * 1.35) }]}
          accessibilityRole="header"
        >
          {inline(token.tokens, ctx)}
          {tail.cursor && <Cursor />}
        </Text>
      )
    }
    case 'list':
      return <List token={token as Tokens.List} ctx={ctx} tail={tail} />
    case 'code':
      return <CodeBlock token={token as Tokens.Code} />
    case 'table':
      return <Table token={token as Tokens.Table} ctx={ctx} />
    case 'blockquote':
      return (
        <View style={styles.quote}>
          <Blocks tokens={token.tokens ?? []} ctx={ctx} tail={tail} color={colors.text} />
        </View>
      )
    case 'hr':
      return <View style={styles.hr} />
    case 'html':
      return <Paragraph tokens={[{ type: 'text', raw: token.raw, text: token.text.trim() }]} ctx={ctx} tail={tail} />
    default:
      return null
  }
}

function Blocks({ tokens, ctx, tail, gap = 14, color }: { tokens: Token[]; ctx: Ctx; tail: Tail; gap?: number; color?: string }) {
  const blocks = tokens.filter((t) => t.type !== 'space')
  return (
    <View style={{ gap }}>
      {blocks.map((t, i) => {
        const block = <Block token={t} ctx={ctx} tail={i === blocks.length - 1 ? tail : NO_TAIL} />
        // A blockquote's text is quieter: its paragraphs take this color.
        return color && (t.type === 'paragraph' || t.type === 'text') ? (
          <Text key={i} size={SIZE} color={color} style={styles.paragraph}>
            {inline(t.tokens, ctx)}
          </Text>
        ) : (
          <Fragment key={i}>{block}</Fragment>
        )
      })}
    </View>
  )
}

interface MarkdownProps {
  text: string
  sources: Source[]
  state?: 'streaming' | 'stopped'
}

export function Markdown({ text, sources, state }: MarkdownProps) {
  // Parsed again on every delta while streaming: the lexer is fast and the
  // text of one answer short.
  const tokens = useMemo(() => parseMarkdown(text), [text])
  const tail = { cursor: state === 'streaming', dim: state === 'stopped' }
  return <Blocks tokens={tokens} ctx={{ sources }} tail={tail} />
}

const styles = StyleSheet.create({
  paragraph: { lineHeight: LINE },
  strong: { fontFamily: fonts.semibold, color: chatColors.inkStrong },
  em: { fontStyle: 'italic' },
  del: { textDecorationLine: 'line-through' },
  codespan: { fontFamily: fonts.mono, fontSize: 13.5, color: chatColors.inlineCode, backgroundColor: chatColors.inlineCodeBg },
  link: { color: brand.cyan, textDecorationLine: 'underline', textDecorationColor: chatColors.quoteLine },
  cite: { fontFamily: fonts.mono, fontSize: 11, color: brand.cyan, backgroundColor: chatColors.citeBg },
  cursor: { color: brand.cyan },
  heading: { marginTop: 8, letterSpacing: -0.2 },
  list: { gap: 6 },
  item: { flexDirection: 'row' },
  marker: { width: 22, lineHeight: LINE },
  markerNumber: { fontFamily: fonts.medium, fontSize: 14.5 },
  itemBody: { flex: 1 },
  quote: { paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: chatColors.quoteLine },
  hr: { height: 1, backgroundColor: chatColors.line },
  code: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: chatColors.line, backgroundColor: chatColors.codeBg },
  codeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 14,
    borderBottomWidth: 1,
    borderBottomColor: chatColors.codeBarLine,
    backgroundColor: chatColors.codeBarBg,
  },
  codeCopy: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 10, borderRadius: 8 },
  pressedBg: { backgroundColor: chatColors.pressedBg },
  codeScroll: { paddingVertical: 14, paddingHorizontal: 16 },
  codeText: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21, color: brand.mint },
  table: { borderWidth: 1, borderColor: chatColors.line, borderRadius: 12, overflow: 'hidden' },
  // Like the web's width: 100%, narrow tables still fill the answer.
  tableRow: { flexDirection: 'row', flexGrow: 1 },
  column: { flexGrow: 1 },
  cell: { height: 40, justifyContent: 'center', paddingHorizontal: 14 },
  headCell: { backgroundColor: chatColors.tableHeadBg },
  headText: { letterSpacing: 0.6, textTransform: 'uppercase', lineHeight: 18 },
  bodyCell: { borderTopWidth: 1, borderTopColor: chatColors.codeBarLine },
  cellText: { lineHeight: 20, fontVariant: ['tabular-nums'] },
})
