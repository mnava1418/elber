import { router } from 'expo-router'
import { Image, StyleSheet, View } from 'react-native'
import { Button, GradientText, Logo, Screen, Text } from '../components'
import { colors } from '../theme'

// Height of the logo bar, also left empty under the hero so the hero sits
// in the middle of the whole screen, not just of the space below the bar.
const NAV_HEIGHT = 44

// The app's welcome: simpler than the web's landing on purpose, just who
// Elber is and the way in. There is no sign-up.
export default function Welcome() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.nav}>
        <Logo size="sm" />
      </View>

      <View style={styles.hero}>
        <Image source={require('../../assets/images/elber.png')} style={styles.mascot} resizeMode="contain" accessibilityLabel="Elber" />
        <View style={styles.title} accessibilityRole="header">
          <Text font="displayBold" size={38} color={colors.textHeading}>
            Hola, soy{' '}
          </Text>
          <GradientText font="displayBold" size={38}>
            Elber
          </GradientText>
        </View>
        <Text size={17} style={styles.center}>
          Platico contigo, recuerdo lo que te importa y cada vez aprendo algo nuevo: el clima, tus pendientes, tu diario, tu
          entrenamiento.
        </Text>
        <Button title="Iniciar sesión" size="lg" onPress={() => router.push('/login')} style={styles.stretch} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  // Screen's content already grows to the full height; the hero takes what's left.
  content: { paddingBottom: 16 },
  nav: { height: NAV_HEIGHT, justifyContent: 'center', paddingHorizontal: 8 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 8, paddingBottom: NAV_HEIGHT },
  mascot: { width: 180, height: 180 },
  title: { flexDirection: 'row', alignItems: 'center' },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: 8 },
})
