import { Stack } from 'expo-router'
import { colors } from '../../theme'

// Inicio is the hub, like the web: a section opened straight (e.g. a deep
// link to a conversation) still has Inicio under it to go back to.
export const unstable_settings = { initialRouteName: 'inicio' }

// Screens for a signed-in user. The root layout only lets this group in with a session.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
}
