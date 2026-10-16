import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Logo } from '../components'
import { ApiError } from '../lib/api'
import { requestPasswordReset } from '../services/auth.service'
import elber from '../assets/elber.png'
// Same look as the login page: reuses its layout, field and alert styles.
import '../styles/Login.css'

type Phase = 'idle' | 'loading' | 'error' | 'success'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    if (error.status === 400) return 'Escribe un correo válido, por ejemplo tu@correo.com'
  }
  return 'No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.'
}

function RecoverPassword() {
  const [email, setEmail] = useState('')
  const [tried, setTried] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [requestError, setRequestError] = useState('')

  const emailError = tried && !EMAIL_RE.test(email.trim())
  const loading = phase === 'loading'

  function clearError() {
    if (phase === 'error') setPhase('idle')
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (loading) return
    setTried(true)
    if (!EMAIL_RE.test(email.trim())) return

    setPhase('loading')
    try {
      await requestPasswordReset(email.trim())
      setPhase('success')
    } catch (error) {
      setRequestError(errorMessage(error))
      setPhase('error')
    }
  }

  return (
    <div className="login">
      <div className="login-glow" aria-hidden="true" />
      <span className="login-spark login-spark--1" aria-hidden="true" />
      <span className="login-spark login-spark--2" aria-hidden="true" />

      <header className="login-nav">
        <Link to="/" className="brand-link">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="login-main">
        <section className="login-card" aria-labelledby="recover-title">
          <img src={elber} alt="" className="login-mascot" />

          <div className="login-head">
            <h1 id="recover-title">Recuperar contraseña</h1>
            <p>Escribe tu correo y te enviaremos un enlace para crear una nueva.</p>
          </div>

          {phase === 'success' ? (
            <div className="login-success" role="status">
              <div className="login-success-icon" aria-hidden="true">✓</div>
              <p className="login-success-title">Revisa tu correo</p>
              {/* Same message whether or not the account exists. */}
              <p className="login-success-sub">
                Si <strong>{email.trim()}</strong> está registrado, recibirás un enlace para
                restablecer tu contraseña. Revisa también la carpeta de spam.
              </p>
              <div className="login-submit">
                <Button as={Link} to="/login" variant="primary" size="lg">
                  Volver a iniciar sesión
                </Button>
              </div>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {phase === 'error' && (
                <div className="login-alert" role="alert">
                  <span className="login-alert-icon" aria-hidden="true">!</span>
                  <span>{requestError}</span>
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError()
                  }}
                  aria-invalid={emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <span id="email-error" className="field-error">
                    Escribe un correo válido, por ejemplo tu@correo.com
                  </span>
                )}
              </div>

              <div className="login-submit">
                <Button type="submit" variant="primary" size="lg" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <span className="login-loading">
                      <span className="login-spinner" aria-hidden="true" />
                      Enviando…
                    </span>
                  ) : (
                    'Enviar enlace'
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        <Link to="/login" className="back-link">
          &larr; Volver a iniciar sesión
        </Link>
      </main>
    </div>
  )
}

export default RecoverPassword
