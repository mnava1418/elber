import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text } from '../components'
import { WifiOffIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { signOutUser } from '../services/auth.service'
import { brand, chatColors, colors, gradients } from '../theme'
import ChatDialog from './ChatDialog'
import ChatHeader from './ChatHeader'
import { Composer } from './Composer'
import { getConversation, toTurns } from './history'
import { ElberMessage, UserMessage } from './Messages'
import type { ChatSection } from './section'
import type { Turn } from './types'
import { useChat } from './useChat'
import { useForegroundReconnect } from './useForegroundReconnect'

type LoadState = 'idle' | 'loading' | 'not_found' | 'error'

type ChatScreenProps = {
  section: ChatSection
  // A saved conversation to open; without it, a new one starts with the first message.
  conversationId?: string
}

// The screen of a chat section (web/src/pages/Chat.tsx). Unlike the web, the
// route doesn't change when the first message creates the conversation: the
// screen keeps it, and a new route would mount a new screen (and socket).
export default function ChatScreen({ section, conversationId }: ChatScreenProps) {
  const { user } = useAuth()
  const name = (user?.displayName || user?.email?.split('@')[0] || 'tú').split(' ')[0]
  const { turns, connection, retryIn, responding, send, stop, retry, reconnectNow, show } = useChat(section.transport)
  useForegroundReconnect(connection, reconnectNow)

  const [loadState, setLoadState] = useState<LoadState>(conversationId ? 'loading' : 'idle')
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Opens the saved conversation; new messages continue it.
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    getConversation(section.api, conversationId)
      .then((saved) => {
        if (cancelled) return
        show(saved.id, toTurns(saved.messages))
        setLoadState('idle')
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadState(error instanceof ApiError && error.status === 404 ? 'not_found' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [conversationId, section.api, show, loadAttempt])

  // The list is inverted (newest at the bottom, anchored there while Elber
  // writes), so it gets the turns newest first.
  const reversed = useMemo(() => [...turns].reverse(), [turns])
  const canRetry = connection === 'open' && !responding
  // Only the last answer can be retried (see useChat's retry).
  const lastTurnId = turns.at(-1)?.id

  const renderTurn = ({ item }: { item: Turn }) =>
    item.role === 'user' ? (
      <UserMessage turn={item} />
    ) : (
      <ElberMessage turn={item} canRetry={canRetry && item.id === lastTurnId} onRetry={retry} />
    )

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ChatHeader connection={connection} />

          {connection === 'reconnecting' && (
            <View style={styles.banner} accessibilityLiveRegion="polite">
              <View style={styles.bannerText}>
                <WifiOffIcon color={chatColors.warnText} />
                <Text size={13.5} color={chatColors.warnText}>
                  {retryIn > 0 ? `Sin conexión. Reintentando en ${retryIn} s…` : 'Sin conexión. Reintentando…'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={reconnectNow} hitSlop={8}>
                <Text font="semibold" size={13.5} color={chatColors.warn} style={styles.underline}>
                  Reintentar ahora
                </Text>
              </Pressable>
            </View>
          )}

          {loadState !== 'idle' ? (
            <LoadMessage
              state={loadState}
              onNew={() => router.replace(section.path)}
              onRetry={() => {
                setLoadState('loading')
                setLoadAttempt((n) => n + 1)
              }}
            />
          ) : turns.length === 0 ? (
            <ScrollView contentContainerStyle={styles.empty} keyboardShouldPersistTaps="handled">
              <Mascot source={connection === 'connecting' ? MASCOTS.idle : MASCOTS.happy} />
              {connection === 'connecting' ? (
                <View style={styles.emptyCopy}>
                  <Text font="display" size={26} color={brand.mint} style={styles.center}>
                    Conectando con Elber…
                  </Text>
                  <Text style={styles.center}>Esto toma solo un momento.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.emptyCopy}>
                    <Text font="display" size={26} color={brand.mint} style={styles.center} accessibilityRole="header">
                      Hola,{' '}
                      {/* The web paints the name with the brand gradient; a gradient can't sit inside a line of text here. */}
                      <Text font="display" size={26} color={brand.cyan}>
                        {name}
                      </Text>
                      . {section.greeting}
                    </Text>
                    <Text size={15.5} style={styles.center}>
                      {section.intro}
                    </Text>
                  </View>
                  <View style={styles.suggestions}>
                    {section.suggestions.map((s) => (
                      <Pressable
                        key={s}
                        accessibilityRole="button"
                        disabled={connection !== 'open'}
                        onPress={() => send(s)}
                        style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed, connection !== 'open' && styles.dim]}
                      >
                        <Text size={14.5} color={brand.mint}>
                          {s}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          ) : (
            <FlatList
              inverted
              data={reversed}
              keyExtractor={(t) => t.id}
              renderItem={renderTurn}
              contentContainerStyle={styles.thread}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
            />
          )}

          <Composer connection={connection} responding={responding} onSend={send} onStop={stop} locked={loadState !== 'idle'} />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {connection === 'forbidden' && (
        <ChatDialog
          title="Esta sección no está disponible"
          text="Tu cuenta no tiene acceso a ella."
          action={{ title: 'Volver al inicio', onPress: () => router.replace('/inicio') }}
        />
      )}
      {connection === 'rejected' && (
        <ChatDialog
          title="Tu sesión ya no es válida"
          text="Inicia sesión otra vez para seguir hablando con Elber."
          // Signing out is enough: the root layout's guard opens the welcome screen.
          action={{ title: 'Volver a iniciar sesión', onPress: () => void signOutUser() }}
        />
      )}
    </View>
  )
}

const MASCOTS = {
  idle: require('../../assets/images/elber.webp'),
  happy: require('../../assets/images/elber_happy.webp'),
  surprise: require('../../assets/images/elber_surprise.webp'),
}

function Mascot({ source }: { source: number }) {
  return (
    <View style={styles.mascotWrap}>
      <View style={styles.mascotGlow} pointerEvents="none" />
      <Image source={source} style={styles.mascot} resizeMode="contain" accessibilityLabel="Elber" />
    </View>
  )
}

function LoadMessage({ state, onNew, onRetry }: { state: Exclude<LoadState, 'idle'>; onNew: () => void; onRetry: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.empty}>
      <Mascot source={state === 'loading' ? MASCOTS.idle : MASCOTS.surprise} />
      <View style={styles.emptyCopy}>
        {state === 'loading' && (
          <Text font="display" size={26} color={brand.mint} style={styles.center}>
            Cargando conversación…
          </Text>
        )}
        {state === 'not_found' && (
          <>
            <Text font="display" size={26} color={brand.mint} style={styles.center}>
              No encontré esta conversación
            </Text>
            <Text style={styles.center}>Puede que la hayas borrado. Empieza una nueva cuando quieras.</Text>
          </>
        )}
        {state === 'error' && (
          <>
            <Text font="display" size={26} color={brand.mint} style={styles.center}>
              No pude cargar esta conversación
            </Text>
            <Text style={styles.center}>Revisa tu conexión e inténtalo de nuevo.</Text>
          </>
        )}
      </View>
      {state === 'not_found' && <Button title="Nueva conversación" onPress={onNew} />}
      {state === 'error' && <Button title="Reintentar" onPress={onRetry} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, backgroundImage: gradients.screen },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
  dim: { opacity: 0.5 },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: chatColors.bannerLine,
    backgroundColor: chatColors.bannerBg,
  },
  bannerText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 32, paddingHorizontal: 20 },
  emptyCopy: { gap: 10, maxWidth: 540 },
  mascotWrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  mascotGlow: { position: 'absolute', width: 188, height: 188, backgroundImage: gradients.glow },
  mascot: { width: 128, height: 128 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  suggestion: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: chatColors.suggestionLine,
    backgroundColor: chatColors.suggestionBg,
  },
  suggestionPressed: { borderColor: brand.cyan },
  thread: { gap: 22, paddingHorizontal: 16, paddingVertical: 20 },
})
