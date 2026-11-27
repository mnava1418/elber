import { colors } from '../theme'
import Screen from './Screen'
import Text from './Text'

// Shown instead of the app when mobile/.env is missing or wrong.
export default function ConfigError({ problems }: { problems: string[] }) {
  return (
    <Screen contentStyle={{ padding: 24, gap: 12 }}>
      <Text font="display" size={22} color={colors.textHeading}>
        Falta configurar la app
      </Text>
      <Text>Revisa mobile/.env (ver .env.example) y recarga la app:</Text>
      {problems.map((problem) => (
        <Text key={problem} size={15} color={colors.errorText}>
          • {problem}
        </Text>
      ))}
    </Screen>
  )
}
