import { useEffect, useState } from 'react'
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '../components'
import { ClockIcon, SendIcon } from '../components/icons'
import { brand, chatColors, fonts, shadows } from '../theme'
import { composerHint, fmt } from './composer-hint'
import { MAX_CHARS, WARN_CHARS, type ConnectionState } from './types'

interface Props {
  connection: ConnectionState
  responding: boolean
  onSend: (text: string) => void
  onStop: () => void
  /** Blocks sending even when connected, e.g. while a conversation loads. */
  locked?: boolean
}

// Whether the keyboard is up: its height already covers the home indicator,
// so the bottom safe area must not be added on top of it.
function useKeyboardShown() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    // iOS announces it before it moves; Android only after.
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setShown(true))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setShown(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  return shown
}

export function Composer({ connection, responding, onSend, onStop, locked = false }: Props) {
  const [text, setText] = useState('')
  const [waitNotice, setWaitNotice] = useState(false)
  const insets = useSafeAreaInsets()
  const keyboardShown = useKeyboardShown()

  const disabled = connection !== 'open' || locked
  const len = text.length
  const over = len > MAX_CHARS
  const canSend = !disabled && !over && text.trim().length > 0
  const hint = locked ? null : composerHint(connection, !disabled && over)

  useEffect(() => {
    if (!waitNotice) return
    const id = setTimeout(() => setWaitNotice(false), 2500)
    return () => clearTimeout(id)
  }, [waitNotice])

  function submit() {
    if (responding) {
      if (text.trim()) setWaitNotice(true)
      return
    }
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  return (
    <View style={[styles.wrap, { paddingBottom: keyboardShown ? 10 : Math.max(insets.bottom, 12) }]}>
      {waitNotice && responding && (
        <View style={styles.toastRow} pointerEvents="none" accessibilityLiveRegion="polite">
          <View style={styles.toast}>
            <ClockIcon color={chatColors.warnText} />
            <Text size={13.5} color={chatColors.warnText}>
              Espera a que termine la respuesta actual
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.composer, disabled && styles.disabled]}>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!disabled}
          multiline
          placeholder={locked ? 'Cargando conversación…' : disabled ? 'Esperando conexión…' : 'Escríbele a Elber…'}
          placeholderTextColor={chatColors.muted}
          selectionColor={brand.cyan}
          // The app is always dark, so its keyboard is too (iOS only; Android's follows the keyboard app).
          keyboardAppearance="dark"
          accessibilityLabel="Mensaje para Elber"
          aria-invalid={over}
          style={styles.input}
        />
        {responding ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Detener la respuesta"
            onPress={onStop}
            style={({ pressed }) => [styles.button, styles.stop, pressed && styles.pressed]}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={submit}
            style={({ pressed }) => [styles.button, styles.send, !canSend && styles.sendOff, pressed && styles.pressed]}
          >
            <SendIcon size={18} color={brand.mint} />
          </Pressable>
        )}
      </View>

      {(hint || len >= WARN_CHARS) && (
        <View style={styles.meta}>
          {hint ? (
            <Text size={12} color={over ? chatColors.errorIcon : chatColors.muted} style={styles.flex}>
              {hint}
            </Text>
          ) : (
            <View style={styles.flex} />
          )}
          {len >= WARN_CHARS && (
            <Text font="medium" size={12} color={over ? chatColors.errorIcon : chatColors.warn} accessibilityLiveRegion="polite">
              {fmt(len)} / {fmt(MAX_CHARS)}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { paddingHorizontal: 12, paddingTop: 8 },
  toastRow: { position: 'absolute', left: 0, right: 0, bottom: '100%', alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: chatColors.toastLine,
    backgroundColor: chatColors.toastBg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: chatColors.composerLine,
    backgroundColor: chatColors.glass,
    boxShadow: shadows.composer,
  },
  disabled: { opacity: 0.55 },
  input: {
    flex: 1,
    maxHeight: 160,
    paddingTop: 9,
    paddingBottom: 9,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: chatColors.inkStrong,
  },
  button: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  send: { backgroundColor: brand.secondary },
  sendOff: { opacity: 0.4 },
  stop: { borderWidth: 1, borderColor: chatColors.composerLine },
  stopSquare: { width: 12, height: 12, borderRadius: 2, backgroundColor: brand.mint },
  pressed: { transform: [{ scale: 0.94 }] },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingHorizontal: 8 },
})
