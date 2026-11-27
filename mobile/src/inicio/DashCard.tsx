import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, Skeleton, Text } from '../components'
import { colors } from '../theme'

// The pieces every Inicio card shares (.dash-card, .dash-label...).

export function DashCard({ children }: { children: ReactNode }) {
  return <Card style={styles.card}>{children}</Card>
}

export function DashLabel({ icon, text, color }: { icon: ReactNode; text: string; color: string }) {
  return (
    <View style={styles.label}>
      {icon}
      <Text font="semibold" size={13} color={color} style={styles.labelText}>
        {text.toUpperCase()}
      </Text>
    </View>
  )
}

export function DashTitle({ children }: { children: ReactNode }) {
  return (
    <Text font="display" size={22} color={colors.textHeading} style={styles.title} accessibilityRole="header">
      {children}
    </Text>
  )
}

export function DashText({ children }: { children: ReactNode }) {
  return <Text size={15}>{children}</Text>
}

export function DashError({ message }: { message: string }) {
  return (
    <Text size={15} color={colors.diary} accessibilityRole="alert">
      {message}
    </Text>
  )
}

// What a card shows while it loads: a title, a line and a block.
export function DashLoading() {
  return (
    <View style={styles.loading} accessibilityLabel="Cargando">
      <Skeleton height={28} width="70%" />
      <Skeleton height={18} width="90%" />
      <Skeleton height={64} marginTop={8} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 22 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelText: { letterSpacing: 0.6 },
  title: { lineHeight: 28 },
  loading: { gap: 10 },
})
