import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from '../components'
import { TrainingIcon } from '../components/icons'
import { brand, colors } from '../theme'
import { DashCard, DashError, DashLabel, DashLoading, DashText, DashTitle } from './DashCard'
import { detail, headline } from './training-text'
import type { CardState, TrainingCardData } from './useInicio'

// Training: what today holds, plus the streak and this week's count (web/src/inicio/TrainingCard.tsx).
export default function TrainingCard({ state }: { state: CardState<TrainingCardData> }) {
  if (state.status === 'unavailable') return null
  const data = state.status === 'ready' ? state.data : null

  return (
    <DashCard>
      <DashLabel icon={<TrainingIcon size={22} color={brand.mint} />} text="Entrenamiento" color={brand.mint} />
      {state.status === 'loading' && <DashLoading />}
      {state.status === 'error' && <DashError message={state.message} />}
      {data && (
        <>
          <DashTitle>{headline(data)}</DashTitle>
          <DashText>{detail(data)}</DashText>
          <View style={styles.stats}>
            <Stat value={`${data.streakWeeks} ${data.streakWeeks === 1 ? 'semana' : 'semanas'}`} label="de racha" />
            <Stat
              value={data.thisWeek.target > 0 ? `${data.thisWeek.done} de ${data.thisWeek.target}` : String(data.thisWeek.done)}
              label={data.thisWeek.done === 1 && data.thisWeek.target === 0 ? 'día esta semana' : 'días esta semana'}
            />
          </View>
          <Button
            title={data.planName ? 'Ver mi plan' : 'Ir a entrenamiento'}
            variant="ghost"
            onPress={() => router.push('/entrenamiento')}
            style={styles.action}
          />
        </>
      )}
    </DashCard>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text font="displayBold" size={22} color={colors.textHeading}>
        {value}
      </Text>
      <Text size={13} color={colors.textMuted}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 14 },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.wellBorder,
    backgroundColor: colors.well,
  },
  action: { alignSelf: 'flex-start' },
})
