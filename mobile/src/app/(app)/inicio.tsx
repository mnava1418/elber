import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Card, Logo, Screen, Text } from '../../components'
import { useAuth } from '../../context/AuthContext'
import { signOutUser } from '../../services/auth.service'
import { colors } from '../../theme'

// Placeholder until the real Inicio (phase 4): proves the session works.
export default function Inicio() {
  const { user } = useAuth()
  const [leaving, setLeaving] = useState(false)

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
    <Screen contentStyle={styles.content}>
      <View style={styles.nav}>
        <Logo size="sm" />
        <Button title="Cerrar sesión" variant="ghost" loading={leaving} onPress={signOut} />
      </View>
      <Card style={styles.card}>
        <Text font="display" size={24} color={colors.textHeading}>
          ¡Hola!
        </Text>
        <Text>Entraste como {user?.email}.</Text>
        <Text size={14} color={colors.textMuted}>
          Aquí va a estar el Inicio con tus chats, tu diario y tu entrenamiento.
        </Text>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { gap: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  card: { gap: 8 },
})
