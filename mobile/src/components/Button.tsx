import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { brand, colors, shadows } from '../theme'
import Text from './Text'

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  // Shows a spinner instead of the title and ignores presses.
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

// Same variants and sizes as web/src/components/Button.tsx.
export default function Button({ title, variant = 'primary', size = 'md', loading = false, disabled, style, ...rest }: ButtonProps) {
  const inactive = disabled || loading
  const textColor = variant === 'primary' ? brand.mint : colors.textHeading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text font="semibold" size={size === 'lg' ? 16 : 15} color={textColor}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lg: { minHeight: 50, paddingVertical: 13, paddingHorizontal: 28 },
  primary: { backgroundColor: brand.secondary, boxShadow: shadows.raised },
  ghost: { backgroundColor: 'transparent', borderColor: colors.border },
  // The web's :active scale; there's no hover on a touch screen.
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
})
