import { Link } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import { StyleSheet, View, type TextInput } from 'react-native'
import AuthLayout, { AuthAlert } from '../auth/AuthLayout'
import { Button, Text, TextField } from '../components'
import { EMAIL_RE, signInErrorMessage } from '../services/auth-errors'
import { signIn } from '../services/auth.service'
import { colors } from '../theme'

type Phase = 'idle' | 'loading' | 'error'

// web/src/pages/Login.tsx. There is no "you're in" pause afterwards: once
// Firebase has the user, the root layout's guard opens Inicio by itself.
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tried, setTried] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)

  const trimmed = email.trim()
  const emailError = tried && !EMAIL_RE.test(trimmed)
  const passwordError = tried && !password
  const loading = phase === 'loading'

  function clearError() {
    if (phase === 'error') setPhase('idle')
  }

  async function submit() {
    if (loading) return
    setTried(true)
    if (!EMAIL_RE.test(trimmed) || !password) return

    setPhase('loading')
    try {
      await signIn(trimmed, password)
      // Stays "loading" until the guard swaps this screen for Inicio.
    } catch (e) {
      setError(signInErrorMessage(e))
      setPhase('error')
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión y seguimos donde lo dejamos."
      back={{ label: 'Volver al inicio', href: '/' }}
    >
      {phase === 'error' && <AuthAlert message={error} />}

      <TextField
        label="Correo electrónico"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={(text) => {
          setEmail(text)
          clearError()
        }}
        error={emailError ? 'Escribe un correo válido, por ejemplo tu@correo.com' : undefined}
        editable={!loading}
      />

      <View style={styles.passwordBlock}>
        <TextField
          ref={passwordRef}
          label="Contraseña"
          placeholder="••••••••"
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            clearError()
          }}
          error={passwordError ? 'Escribe tu contraseña para continuar' : undefined}
          editable={!loading}
        />
        <Link href="/reset" style={styles.forgot}>
          <Text size={13} color={colors.accent}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Link>
      </View>

      <Button title="Iniciar sesión" size="lg" loading={loading} onPress={submit} style={styles.submit} />
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  passwordBlock: { gap: 10 },
  forgot: { alignSelf: 'flex-end', paddingVertical: 4 },
  submit: { marginTop: 6 },
})
