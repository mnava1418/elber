import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

// Shown instead of the app when mobile/.env is missing or wrong.
export default function ConfigError({ problems }: { problems: string[] }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Falta configurar la app</Text>
        <Text style={styles.text}>Revisa mobile/.env (ver .env.example) y recarga la app:</Text>
        {problems.map((problem) => (
          <Text key={problem} style={styles.problem}>
            • {problem}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textHeading },
  text: { fontSize: 16, color: colors.text },
  problem: { fontSize: 15, color: colors.danger },
})
