import { Image, StyleSheet, View } from 'react-native'
import { colors } from '../theme'
import Screen from './Screen'
import SectionHeader from './SectionHeader'
import Text from './Text'

// Stand-in for a section whose screen comes in a later phase, so Inicio's
// cards already have somewhere to go.
export default function ComingSoon({ title, detail }: { title: string; detail?: string }) {
  return (
    <Screen contentStyle={styles.content}>
      <SectionHeader title={title} />
      <View style={styles.body}>
        <Image source={require('../../assets/images/elber_thinking.webp')} style={styles.mascot} resizeMode="contain" />
        <Text font="display" size={22} color={colors.textHeading}>
          Muy pronto
        </Text>
        <Text style={styles.center}>Esta sección todavía se está construyendo en la app.</Text>
        {detail ? (
          <Text size={13} color={colors.textMuted} style={styles.center}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: 0 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 44 },
  mascot: { width: 120, height: 120 },
  center: { textAlign: 'center' },
})
