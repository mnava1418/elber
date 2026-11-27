import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import ConfigError from '../components/ConfigError'
import { envResult } from '../config/env'
import { colors, fontAssets } from '../theme'

// Keep the splash until the fonts are in, so no text flashes in the system font.
void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // A font that fails to load falls back to the system's: not worth blocking the app.
  const [loaded, error] = useFonts(fontAssets)
  const ready = loaded || Boolean(error)

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <>
      <StatusBar style="light" />
      {/* Without a valid configuration nothing else can work: say what is wrong. */}
      {envResult.ok ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      ) : (
        <ConfigError problems={envResult.problems} />
      )}
    </>
  )
}
