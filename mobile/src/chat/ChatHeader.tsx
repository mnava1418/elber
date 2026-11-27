import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { Logo, Text } from '../components'
import { BackIcon } from '../components/icons'
import { brand, chatColors, colors } from '../theme'
import type { ConnectionState } from './types'

// The web's labels (web/src/chat/ChatHeader.tsx).
const STATUS: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  open: 'Conectado',
  reconnecting: 'Reconectando…',
  rejected: 'Sesión inválida',
  forbidden: 'Sin acceso',
}

const DOT: Record<ConnectionState, string> = {
  connecting: brand.mint,
  open: brand.cyan,
  reconnecting: brand.orange,
  rejected: chatColors.error,
  forbidden: chatColors.error,
}

// Back to Inicio, the logo and the connection's state. The user menu of the
// web lives in Inicio here (sign out), and the history comes in phase 7.
export default function ChatHeader({ connection }: { connection: ConnectionState }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
        style={styles.back}
      >
        <BackIcon color={colors.textHeading} />
      </Pressable>
      <Logo size="sm" />
      <View style={styles.spacer} />
      <View style={styles.status} accessible accessibilityRole="text" accessibilityLabel={`Estado: ${STATUS[connection]}`}>
        <View style={[styles.dot, { backgroundColor: DOT[connection], boxShadow: `0 0 8px ${DOT[connection]}` }]} />
        <Text size={12.5}>{STATUS[connection]}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: chatColors.headerLine,
    backgroundColor: chatColors.headerBg,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -4 },
  spacer: { flex: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: chatColors.line,
    backgroundColor: chatColors.statusBg,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
})
