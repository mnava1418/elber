import { Image, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components'
import { AlertIcon, RefreshIcon } from '../components/icons'
import { chatColors, colors, shadows } from '../theme'
import ThinkingDots from './ThinkingDots'
import type { ElberStatus, ElberTurn, UserTurn } from './types'

// The chat's two kinds of message. Phase 5 shows the answer as plain text;
// Markdown, tool steps, sources and copying come in phase 6
// (web/src/chat/ElberMessage.tsx).

const MASCOT: Record<ElberStatus, number> = {
  thinking: require('../../assets/images/elber_thinking.webp'),
  streaming: require('../../assets/images/elber.webp'),
  done: require('../../assets/images/elber_happy.webp'),
  stopped: require('../../assets/images/elber.webp'),
  error: require('../../assets/images/elber_surprise.webp'),
}

export function UserMessage({ turn }: { turn: UserTurn }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text size={15.5} color={chatColors.inkStrong} selectable>
          {turn.text}
        </Text>
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
  const { status, steps, text } = turn
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

      {status === 'thinking' && !text && (
        <View style={styles.thinking} accessibilityRole="text" accessibilityLabel={toolRunning ? 'Trabajando…' : 'Pensando…'}>
          <ThinkingDots />
          <Text size={14}>{toolRunning ? 'Trabajando…' : 'Pensando…'}</Text>
        </View>
      )}

      {text ? (
        <Text size={15.5} color={chatColors.ink} selectable style={styles.answer}>
          {text}
        </Text>
      ) : null}

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
  userRow: { flexDirection: 'row', justifyContent: 'flex-end' },
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
  answer: { lineHeight: 26 },
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
