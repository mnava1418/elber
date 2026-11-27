import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import ConfigError from '../components/ConfigError'
import { envResult } from '../config/env'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { colors, fontAssets } from '../theme'

// Keep the splash until the fonts and the saved session are in, so the app
// opens straight on the right screen, in the right font.
void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // A font that fails to load falls back to the system's: not worth blocking the app.
  const [loaded, error] = useFonts(fontAssets)
  const fontsReady = loaded || Boolean(error)

  // Without a valid configuration nothing else can work: say what is wrong.
  if (!envResult.ok) {
    if (fontsReady) void SplashScreen.hideAsync()
    return fontsReady ? <ConfigError problems={envResult.problems} /> : null
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator fontsReady={fontsReady} />
    </AuthProvider>
  )
}

// The web's GuestRoute and ProtectedRoute: each group only exists for its kind of user,
// and switching (sign in, sign out, expired session) sends the user to the other one.
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { user, loading } = useAuth()
  const ready = fontsReady && !loading

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!user} redirectTo="/inicio">
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="reset" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)} redirectTo="/">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* Development only: the screen itself redirects in a release build. */}
      <Stack.Screen name="catalogo" />
    </Stack>
  )
}
