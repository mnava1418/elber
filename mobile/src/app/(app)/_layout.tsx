import { Stack } from 'expo-router'
import { colors } from '../../theme'

// Screens for a signed-in user. The root layout only lets this group in with a session.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
}
