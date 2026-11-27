import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from '../components'
import { DiaryIcon } from '../components/icons'
import { DIARY } from '../chat/section'
import { colors } from '../theme'
import { DashCard, DashError, DashLabel, DashLoading, DashText, DashTitle } from './DashCard'
import { weekdayInitial, weekdayName } from './format'
import type { CardState, DiaryCardData } from './useInicio'

// The diary: whether we talked today, and the last week at a glance (web/src/inicio/DiaryCard.tsx).
export default function DiaryCard({ state }: { state: CardState<DiaryCardData> }) {
  // Not this user's section: no card at all.
  if (state.status === 'unavailable') return null
  const data = state.status === 'ready' ? state.data : null
  const talkedDays = data?.week.filter((d) => d.talked).length ?? 0

  return (
    <DashCard>
      <DashLabel icon={<DiaryIcon size={22} color={colors.diary} />} text="Diario" color={colors.diary} />
      {state.status === 'loading' && <DashLoading />}
      {state.status === 'error' && <DashError message={state.message} />}
      {data && (
        <>
          <DashTitle>{data.talkedToday ? 'Ya platicamos hoy' : 'Aún no platicamos hoy'}</DashTitle>
          <DashText>
            {data.talkedToday
              ? '¿Se te olvidó algo? Sigue donde nos quedamos.'
              : '¿Cómo te fue? Platícamelo y lo guardo como la entrada de hoy.'}
          </DashText>
          <View
            style={styles.week}
            accessible
            accessibilityLabel={`Últimos 7 días: ${talkedDays} con conversación. ${data.week
              .map((d) => `${weekdayName(d.date)}: ${d.talked ? 'con conversación' : 'sin conversación'}`)
              .join(', ')}`}
          >
            {data.week.map((d) => (
              <View key={d.date} style={styles.day}>
                <View style={[styles.bar, d.talked && styles.barDone]} />
                <Text size={12} color={colors.textMuted}>
                  {weekdayInitial(d.date)}
                </Text>
              </View>
            ))}
          </View>
          <Button
            title={data.talkedToday ? 'Seguir platicando' : 'Platicar de hoy'}
            variant={data.talkedToday ? 'ghost' : 'primary'}
            onPress={() => router.push(DIARY.path)}
            style={styles.action}
          />
        </>
      )}
    </DashCard>
  )
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 14 },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: colors.diaryEmpty },
  barDone: { backgroundColor: colors.diary },
  action: { alignSelf: 'flex-start' },
})
