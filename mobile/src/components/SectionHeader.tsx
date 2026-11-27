import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../theme'
import { BackIcon } from './icons'
import Text from './Text'

// The top bar of a section's screen: back to Inicio (the swipe and Android's
// back button do the same) and the section's name.
export default function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
        style={styles.back}
      >
        <BackIcon color={colors.textHeading} />
      </Pressable>
      <Text font="display" size={18} color={colors.textHeading} accessibilityRole="header">
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
})
