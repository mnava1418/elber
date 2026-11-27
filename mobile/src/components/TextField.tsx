import { useId, useState, type ComponentRef, type Ref } from 'react'
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { colors, fonts, shadows } from '../theme'
import Text from './Text'

type TextFieldProps = TextInputProps & {
  label: string
  // React 19 passes refs as props: lets a form move the focus to the next field.
  ref?: Ref<ComponentRef<typeof TextInput>>
  // Shown under the field, which turns red (the login's aria-invalid style).
  error?: string
  // A password field with the login's "Mostrar / Ocultar" toggle.
  password?: boolean
}

// web/src/components/TextField.tsx plus the login page's error and password states.
export default function TextField({ label, error, password = false, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.field}>
      <Text nativeID={id} font="semibold" size={13} color={colors.textHeading}>
        {label}
      </Text>
      <View>
        <TextInput
          ref={ref}
          accessibilityLabelledBy={id}
          aria-invalid={Boolean(error)}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          // The app is always dark, so its keyboard is too (iOS only; Android's follows the keyboard app).
          keyboardAppearance="dark"
          secureTextEntry={password && !visible}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          style={[
            styles.input,
            password && styles.withToggle,
            focused && styles.focused,
            error ? styles.invalid : null,
            error && focused ? styles.invalidFocused : null,
            style,
          ]}
          {...rest}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
          >
            <Text font="semibold" size={13} color={colors.accent}>
              {visible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text size={13} color={colors.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textHeading,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.well,
  },
  withToggle: { paddingRight: 92 },
  focused: { borderColor: colors.accent, boxShadow: shadows.focusRing },
  invalid: { borderColor: colors.error },
  invalidFocused: { boxShadow: shadows.errorRing },
  toggle: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
})
