import { useState } from 'react'
import { Alert, Image, RefreshControl, StyleSheet, View } from 'react-native'
import { Button, GradientText, Logo, Screen, Text } from '../../components'
import { useAuth } from '../../context/AuthContext'
import ChatCard from '../../inicio/ChatCard'
import DiaryCard from '../../inicio/DiaryCard'
import TrainingCard from '../../inicio/TrainingCard'
import { longToday } from '../../inicio/format'
import { useInicio } from '../../inicio/useInicio'
import { useReloadOnReturn } from '../../inicio/useReloadOnReturn'
import { signOutUser } from '../../services/auth.service'
import { colors } from '../../theme'

// The dashboard: a card per section, each showing how the day goes there
// (web/src/pages/Inicio.tsx). Its cards open the sections, and back returns here.
export default function Inicio() {
  const { user } = useAuth()
  const { chat, diary, training, refreshing, refresh, reload } = useInicio()
  const markLoaded = useReloadOnReturn(reload)
  const [leaving, setLeaving] = useState(false)
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''

  async function signOut() {
    setLeaving(true)
    try {
      // The root layout's guard sends the user back to the welcome screen.
      await signOutUser()
    } catch {
      setLeaving(false)
      Alert.alert('No se pudo cerrar la sesión', 'Inténtalo de nuevo.')
    }
  }

  return (
    <Screen
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            markLoaded()
            void refresh()
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <View style={styles.nav}>
        <Logo size="sm" />
        <Button title="Cerrar sesión" variant="ghost" loading={leaving} onPress={signOut} />
      </View>

      <View style={styles.hero}>
        <Image source={require('../../../assets/images/elber_happy.webp')} style={styles.mascot} resizeMode="contain" />
        <View style={styles.heroText}>
          <View style={styles.greeting} accessible accessibilityRole="header" accessibilityLabel={name ? `Hola, ${name}` : 'Hola'}>
            <Text font="display" size={32} color={colors.textHeading}>
              Hola{name ? ', ' : ''}
            </Text>
            {name ? (
              <GradientText font="display" size={32}>
                {name}
              </GradientText>
            ) : null}
          </View>
          <Text size={16}>{longToday()} · Así va tu día.</Text>
        </View>
      </View>

      <ChatCard state={chat} />
      <DiaryCard state={diary} />
      <TrainingCard state={training} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { gap: 20, paddingBottom: 32 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4, marginBottom: 8 },
  mascot: { width: 64, height: 64 },
  heroText: { flex: 1, gap: 2 },
  greeting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
})
