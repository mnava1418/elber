import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { envResult } from '../config/env'
import ConfigError from '../components/ConfigError'

export default function RootLayout() {
  // Without a valid configuration nothing else can work: say what is wrong.
  if (!envResult.ok) return <ConfigError problems={envResult.problems} />

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
