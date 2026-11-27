import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Skeleton, Text } from '../components'
import { ChatIcon, SendIcon } from '../components/icons'
import { CHAT } from '../chat/section'
import { brand, colors } from '../theme'
import { DashCard, DashError, DashLabel, DashText, DashTitle } from './DashCard'
import { whenUpdated } from './format'
import type { CardState, ChatCardData } from './useInicio'

// The chat: the latest conversations to pick up again (web/src/inicio/ChatCard.tsx).
export default function ChatCard({ state }: { state: CardState<ChatCardData> }) {
  if (state.status === 'unavailable') return null
  const recent = state.status === 'ready' ? state.data.recent : []
  const isNew = state.status === 'ready' && recent.length === 0

  return (
    <DashCard>
      <DashLabel icon={<ChatIcon size={22} color={brand.cyan} />} text="Chat" color={brand.cyan} />
      <DashTitle>{isNew ? 'Empieza a platicar' : 'Retoma donde te quedaste'}</DashTitle>
      <DashText>
        {isNew ? 'Pregúntame lo que quieras: el clima, tus pendientes, una idea.' : 'Tus conversaciones más recientes, o empieza una nueva.'}
      </DashText>

      <View style={styles.list}>
        {state.status === 'loading' && [0, 1, 2].map((i) => <Skeleton key={i} height={64} radius={12} />)}
        {state.status === 'error' && <DashError message={state.message} />}
        {recent.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="link"
            accessibilityLabel={`${c.title}, ${whenUpdated(c.updatedAt)}`}
            onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: c.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowText}>
              <Text font="semibold" size={15} color={colors.textHeading} numberOfLines={1}>
                {c.title}
              </Text>
              <Text size={13} color={colors.textMuted}>
                {whenUpdated(c.updatedAt)}
              </Text>
            </View>
            <SendIcon />
          </Pressable>
        ))}
      </View>

      <Button title="Nueva conversación" onPress={() => router.push(CHAT.path)} style={styles.action} />
    </DashCard>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.wellBorder,
    backgroundColor: colors.well,
  },
  // The web's :hover border, while the finger is down.
  rowPressed: { borderColor: colors.accent },
  rowText: { flex: 1, gap: 3 },
  action: { alignSelf: 'flex-start', marginTop: 6 },
})
