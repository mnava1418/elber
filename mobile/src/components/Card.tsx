import { StyleSheet, View, type ViewProps } from 'react-native'
import { colors, shadows } from '../theme'

// web/src/components/Card.tsx with phone-sized padding (the web's 40px 32px
// leaves little room on a 375pt screen); override it with `style`.
export default function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    boxShadow: shadows.raised,
    padding: 20,
  },
})
