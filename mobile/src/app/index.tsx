import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, GradientText, Logo, Screen, Text } from '../components'
import { envResult } from '../config/env'
import { colors } from '../theme'

// Placeholder until the welcome and login screens (phase 3).
export default function Index() {
  const apiUrl = envResult.ok ? envResult.env.apiUrl : ''

  return (
    <Screen contentStyle={styles.content}>
      <Logo size="lg" withWordmark={false} />
      <View style={styles.title}>
        <Text font="display" size={28} color={colors.textHeading}>
          Hola, soy{' '}
        </Text>
        <GradientText font="display" size={28}>
          Elber
        </GradientText>
      </View>
      <Text>La app móvil está en construcción.</Text>
      <Text size={13} color={colors.textMuted}>
        API: {apiUrl}
      </Text>
      {__DEV__ && <Button title="Ver catálogo de componentes" variant="ghost" onPress={() => router.push('/catalogo')} />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { flexDirection: 'row', alignItems: 'center' },
})
