import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet } from 'react-native'
import AuthLayout, { AuthAlert, AuthSuccess } from '../auth/AuthLayout'
import { Button, Text, TextField } from '../components'
import { EMAIL_RE, passwordResetErrorMessage } from '../services/auth-errors'
import { requestPasswordReset } from '../services/auth.service'
import { colors } from '../theme'

type Phase = 'idle' | 'loading' | 'error' | 'success'

// web/src/pages/RecoverPassword.tsx (same route name, /reset).
export default function RecoverPassword() {
  const [email, setEmail] = useState('')
  const [tried, setTried] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [requestError, setRequestError] = useState('')

  const trimmed = email.trim()
  const emailError = tried && !EMAIL_RE.test(trimmed)
  const loading = phase === 'loading'

  async function submit() {
    if (loading) return
    setTried(true)
    if (!EMAIL_RE.test(trimmed)) return

    setPhase('loading')
    try {
      await requestPasswordReset(trimmed)
      setPhase('success')
    } catch (error) {
      setRequestError(passwordResetErrorMessage(error))
      setPhase('error')
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Escribe tu correo y te enviaremos un enlace para crear una nueva."
      back={{ label: 'Volver a iniciar sesión', href: '/login' }}
    >
      {phase === 'success' ? (
        <AuthSuccess title="Revisa tu correo">
          {/* Same message whether or not the account exists. */}
          <Text size={14} style={styles.center}>
            Si{' '}
            <Text font="semibold" size={14} color={colors.textHeading}>
              {trimmed}
            </Text>{' '}
            está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
          </Text>
          <Button
            title="Volver a iniciar sesión"
            size="lg"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
            style={styles.full}
          />
        </AuthSuccess>
      ) : (
        <>
          {phase === 'error' && <AuthAlert message={requestError} />}
          <TextField
            label="Correo electrónico"
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="send"
            onSubmitEditing={submit}
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (phase === 'error') setPhase('idle')
            }}
            error={emailError ? 'Escribe un correo válido, por ejemplo tu@correo.com' : undefined}
            editable={!loading}
          />
          <Button title="Enviar enlace" size="lg" loading={loading} onPress={submit} style={styles.submit} />
        </>
      )}
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  full: { alignSelf: 'stretch', marginTop: 8 },
  submit: { marginTop: 6 },
})
