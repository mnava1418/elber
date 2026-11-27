import * as Clipboard from 'expo-clipboard'
import { useEffect, useState, type ComponentType } from 'react'
import { AccessibilityInfo, Animated, Easing, Image, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components'
import {
  AlertIcon,
  BookmarkIcon,
  BugIcon,
  CheckIcon,
  ChevronIcon,
  CloudIcon,
  CopyIcon,
  DumbbellIcon,
  GlobeIcon,
  JournalIcon,
  NoteIcon,
  PageIcon,
  RefreshIcon,
  TodoIcon,
} from '../components/icons'
import { brand, chatColors, colors, shadows } from '../theme'
import { Markdown } from './Markdown'
import { LABEL, stepsSummary } from './steps'
import ThinkingDots from './ThinkingDots'
import { hostOf } from './tools'
import type { ElberStatus, ElberTurn, Source, ToolKind, ToolStep, UserTurn } from './types'

// The chat's two kinds of message (web/src/chat/ElberMessage.tsx). A long
// press on a message copies its text, since a native Text can't be selected
// in pieces inside a list the way the web's can.

const MASCOT: Record<ElberStatus, number> = {
  thinking: require('../../assets/images/elber_thinking.webp'),
  streaming: require('../../assets/images/elber.webp'),
  done: require('../../assets/images/elber_happy.webp'),
  stopped: require('../../assets/images/elber.webp'),
  error: require('../../assets/images/elber_surprise.webp'),
}

const ICON: Record<ToolKind, ComponentType<{ size?: number; color?: string }>> = {
  search: GlobeIcon,
  read: PageIcon,
  weather: CloudIcon,
  remember: BookmarkIcon,
  forget: BookmarkIcon,
  add_todo: TodoIcon,
  complete_todo: TodoIcon,
  list_todos: TodoIcon,
  save_note: NoteIcon,
  search_notes: NoteIcon,
  read_note: NoteIcon,
  update_note: NoteIcon,
  link_notes: NoteIcon,
  report_bug: BugIcon,
  save_entry: JournalIcon,
  read_month: JournalIcon,
  list_months: JournalIcon,
  get_coaching_guide: DumbbellIcon,
  get_training_profile: DumbbellIcon,
  update_training_profile: DumbbellIcon,
  get_plans: DumbbellIcon,
  create_plan: DumbbellIcon,
  update_plan: DumbbellIcon,
  get_training_progress: DumbbellIcon,
}

const open = (url: string) => void Linking.openURL(url).catch(() => {})

// Copies a text and says so for two seconds.
function useCopy() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])
  const copy = (text: string) => void Clipboard.setStringAsync(text).then(() => setCopied(true))
  return { copied, copy }
}

export function UserMessage({ turn }: { turn: UserTurn }) {
  const { copied, copy } = useCopy()
  return (
    <View style={styles.userRow}>
      <Pressable
        onLongPress={() => copy(turn.text)}
        accessibilityHint="Mantén presionado para copiar"
        style={({ pressed }) => [styles.userBubble, pressed && styles.pressed]}
      >
        <Text size={15.5} color={chatColors.inkStrong}>
          {turn.text}
        </Text>
      </Pressable>
      {copied && (
        <Text size={12} color={chatColors.muted} accessibilityLiveRegion="polite">
          Copiado
        </Text>
      )}
    </View>
  )
}

// A ring that turns while a tool runs (.step-spinner). Still when the user
// asked the system to reduce motion.
function Spinner() {
  const [turn] = useState(() => new Animated.Value(0))
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null
    let cancelled = false
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return
      loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }))
      loop.start()
    })
    return () => {
      cancelled = true
      loop?.stop()
    }
  }, [turn])
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  return <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} accessibilityLabel="En curso" />
}

function ToolSteps({ steps }: { steps: ToolStep[] }) {
  return (
    <View style={styles.steps} accessibilityLabel="Pasos de Elber">
      {steps.map((s) => {
        const Icon = ICON[s.kind]
        const running = s.status === 'running'
        return (
          <View key={s.id} style={styles.step}>
            <View style={[styles.stepIcon, running && styles.stepIconLive]}>
              <Icon color={brand.cyan} />
            </View>
            <Text size={13.5} color={running ? brand.mint : colors.text} style={styles.flex}>
              {LABEL[s.kind]}
              {s.detail ? (
                <>
                  {': '}
                  <Text size={13.5} color={brand.mint}>
                    {s.detail}
                  </Text>
                </>
              ) : null}
            </Text>
            {running ? <Spinner /> : <CheckIcon color={brand.cyan} />}
          </View>
        )
      })}
    </View>
  )
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <View style={styles.sources} accessibilityLabel="Fuentes">
      <Text size={11.5} color={chatColors.muted} style={styles.sourcesLabel}>
        FUENTES
      </Text>
      <View style={styles.sourceList}>
        {sources.map((s) => (
          <Pressable
            key={s.n}
            accessibilityRole="link"
            onPress={() => open(s.url)}
            style={({ pressed }) => [styles.source, pressed && styles.sourcePressed]}
          >
            <View style={styles.sourceN}>
              <Text font="mono" size={11.5} color={brand.cyan}>
                {s.n}
              </Text>
            </View>
            <View style={styles.sourceText}>
              <Text font="semibold" size={12.5} color={brand.mint} numberOfLines={1}>
                {hostOf(s.url) ?? s.url}
              </Text>
              <Text size={12} numberOfLines={1}>
                {s.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

interface ElberMessageProps {
  turn: ElberTurn
  canRetry: boolean
  onRetry: (id: string) => void
}

export function ElberMessage({ turn, canRetry, onRetry }: ElberMessageProps) {
  const [showSteps, setShowSteps] = useState(false)
  const { copied, copy } = useCopy()
  const { status, steps, text, sources } = turn
  const live = status === 'thinking' || status === 'streaming'
  const toolRunning = steps.some((s) => s.status === 'running')

  return (
    <View style={styles.elber} accessibilityState={{ busy: live }}>
      <View style={styles.head}>
        <View
          style={[
            styles.avatar,
            live && styles.avatarLive,
            status === 'error' && styles.avatarError,
            (status === 'error' || status === 'stopped') && styles.avatarQuiet,
          ]}
        >
          <Image source={MASCOT[status]} style={styles.avatarImage} resizeMode="contain" />
        </View>
        <Text font="display" size={14} color={colors.textHeading}>
          Elber
        </Text>
      </View>

      {steps.length > 0 && !live && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showSteps }}
          onPress={() => setShowSteps((v) => !v)}
          style={({ pressed }) => [styles.stepsSummary, pressed && styles.pressedBg]}
        >
          <CheckIcon color={brand.cyan} />
          <Text size={13} style={styles.flexShrink}>
            {stepsSummary(steps)}
          </Text>
          <View style={showSteps && styles.flipped}>
            <ChevronIcon color={colors.text} />
          </View>
        </Pressable>
      )}
      {steps.length > 0 && (live || showSteps) && <ToolSteps steps={steps} />}

      {status === 'thinking' && !toolRunning && !text && (
        <View style={styles.thinking} accessibilityRole="text" accessibilityLabel="Pensando…">
          <ThinkingDots />
          <Text size={14}>Pensando…</Text>
        </View>
      )}

      {text ? (
        <Pressable onLongPress={() => copy(text)} accessibilityHint="Mantén presionado para copiar la respuesta">
          <Markdown text={text} sources={sources} state={status === 'streaming' ? 'streaming' : status === 'stopped' ? 'stopped' : undefined} />
        </Pressable>
      ) : null}

      {status === 'done' && sources.length > 0 && <Sources sources={sources} />}

      {status === 'done' && (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copiar respuesta"
            onPress={() => copy(text)}
            hitSlop={4}
            style={({ pressed }) => [styles.action, pressed && styles.pressedBg]}
          >
            {copied ? <CheckIcon size={16} color={brand.mint} /> : <CopyIcon size={16} color={chatColors.muted} />}
          </Pressable>
          {copied && (
            <Text size={12.5} color={chatColors.muted} accessibilityLiveRegion="polite">
              Copiado
            </Text>
          )}
        </View>
      )}

      {status === 'stopped' && (
        <View style={styles.stopped}>
          <View style={styles.stoppedLabel}>
            <View style={styles.stoppedSquare} />
            <Text size={13}>Respuesta detenida</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!canRetry}
            onPress={() => onRetry(turn.id)}
            style={({ pressed }) => [styles.smallButton, !canRetry && styles.disabled, pressed && styles.pressed]}
          >
            <RefreshIcon size={13} color={colors.textHeading} />
            <Text font="medium" size={13} color={colors.textHeading}>
              Regenerar
            </Text>
          </Pressable>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.error} accessibilityRole="alert">
          <View style={styles.errorText}>
            <AlertIcon color={chatColors.errorIcon} />
            <Text size={14.5} color={chatColors.errorText} style={styles.flex}>
              {turn.retryAfter
                ? `Llegaste al límite de mensajes. Inténtalo de nuevo en ${Math.ceil(turn.retryAfter / 60)} min.`
                : 'Elber no pudo responder, inténtalo de nuevo.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!canRetry}
            onPress={() => onRetry(turn.id)}
            style={({ pressed }) => [styles.errorRetry, !canRetry && styles.disabled, pressed && styles.pressed]}
          >
            <RefreshIcon color={chatColors.errorText} />
            <Text font="semibold" size={13.5} color={chatColors.errorText}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  userRow: { alignItems: 'flex-end', gap: 4 },
  userBubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderWidth: 1,
    borderColor: chatColors.userBubbleLine,
    backgroundImage: chatColors.userBubble,
  },
  elber: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: chatColors.avatarLine,
    backgroundImage: chatColors.avatarBg,
    boxShadow: shadows.avatar,
  },
  avatarLive: { borderColor: chatColors.avatarLineLive, boxShadow: shadows.avatarLive },
  avatarError: { borderColor: chatColors.avatarLineError },
  avatarQuiet: { boxShadow: 'none' },
  avatarImage: { width: 24, height: 24 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepsSummary: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: -2,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 8,
  },
  flipped: { transform: [{ rotate: '180deg' }] },
  steps: { gap: 2, marginLeft: 14, paddingLeft: 16, borderLeftWidth: 1.5, borderLeftColor: chatColors.stepsLine },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 },
  stepIcon: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: chatColors.stepIconBg },
  stepIconLive: { backgroundColor: chatColors.stepIconBgLive, boxShadow: shadows.stepLive },
  spinner: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: chatColors.spinnerTrack, borderTopColor: brand.cyan },
  sources: { gap: 8, marginTop: 4 },
  sourcesLabel: { letterSpacing: 0.7 },
  sourceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  source: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: chatColors.line,
    backgroundColor: chatColors.suggestionBg,
  },
  sourcePressed: { borderColor: chatColors.quoteLine },
  sourceN: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: chatColors.sourceNumberBg },
  sourceText: { flexShrink: 1, maxWidth: 220 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -8 },
  action: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pressedBg: { backgroundColor: chatColors.pressedBg },
  stopped: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: chatColors.stoppedLine,
  },
  stoppedLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stoppedSquare: { width: 9, height: 9, borderRadius: 2, backgroundColor: colors.text },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    gap: 10,
    padding: 12,
    paddingLeft: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: chatColors.errorLine,
    backgroundColor: chatColors.errorBg,
  },
  errorText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorRetry: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: chatColors.avatarLineError,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
})
