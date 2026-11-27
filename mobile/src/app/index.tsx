import { StyleSheet, Text, View } from 'react-native'
import { envResult } from '../config/env'
import { colors } from '../theme/colors'

// Placeholder until the welcome and login screens (phase 3).
export default function Index() {
  const apiUrl = envResult.ok ? envResult.env.apiUrl : ''

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Hola, soy Elber</Text>
      <Text style={styles.text}>La app móvil está en construcción.</Text>
      <Text style={styles.detail}>API: {apiUrl}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '700', color: colors.textHeading },
  text: { fontSize: 16, color: colors.text },
  detail: { fontSize: 13, color: colors.secondary },
})
