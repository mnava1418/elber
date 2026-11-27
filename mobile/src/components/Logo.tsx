import { StyleSheet, View } from 'react-native'
import { colors } from '../theme'
import LogoMark from './LogoMark'
import Text from './Text'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  withWordmark?: boolean
}

// Sizes from web/src/styles/components/Logo.css (mark width, wordmark font size).
const SIZES = {
  sm: { mark: 28, text: 20 },
  md: { mark: 24, text: 18 },
  lg: { mark: 72, text: 28 },
}

export default function Logo({ size = 'sm', withWordmark = true }: LogoProps) {
  const { mark, text } = SIZES[size]

  return (
    <View
      style={styles.logo}
      accessible
      accessibilityRole="image"
      accessibilityLabel={withWordmark ? 'Elber' : 'Logo de Elber'}
    >
      <LogoMark size={mark} />
      {withWordmark && (
        <Text font="display" size={text} color={colors.textHeading}>
          Elber
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
})
