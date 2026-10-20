import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Logo } from '../components'
import { signIn } from '../services/auth.service'
import elber from '../assets/elber.png'
import '../styles/Login.css'

type Phase = 'idle' | 'loading' | 'error' | 'success'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tried, setTried] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const emailError = tried && !EMAIL_RE.test(email)
  const passwordError = tried && !password
  const credentialsError = phase === 'error'
  const loading = phase === 'loading'

  function clearError() {
    if (phase === 'error') setPhase('idle')
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (loading) return
    setTried(true)
    if (!EMAIL_RE.test(email) || !password) return

    setPhase('loading')
    try {
      await signIn(email, password)
      setPhase('success')
      timer.current = window.setTimeout(() => navigate('/chat'), 2000)
    } catch {
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
        <section className="login-card" aria-labelledby="login-title">
          <img src={elber} alt="" className="login-mascot" />

          <div className="login-head">
            <h1 id="login-title">Bienvenido de vuelta</h1>
            <p>Inicia sesión y seguimos donde lo dejamos.</p>
          </div>

          {phase === 'success' ? (
            <div className="login-success" role="status">
              <div className="login-success-icon" aria-hidden="true">✓</div>
              <p className="login-success-title">¡Listo, ya estás dentro!</p>
              <p className="login-success-sub">Te llevo con Elber…</p>
              <div className="login-progress"><span /></div>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {credentialsError && (
                <div className="login-alert" role="alert">
                  <span className="login-alert-icon" aria-hidden="true">!</span>
                  <span>Correo y/o contraseña incorrectos.</span>
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
                  aria-invalid={emailError || credentialsError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <span id="email-error" className="field-error">
                    Escribe un correo válido, por ejemplo tu@correo.com
                  </span>
                )}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="password">Contraseña</label>
                  <Link to="/reset" className="login-link">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="field-password">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearError()
                    }}
                    aria-invalid={passwordError || credentialsError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    aria-pressed={showPassword}
                    aria-controls="password"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {passwordError && (
                  <span id="password-error" className="field-error">
                    Escribe tu contraseña para continuar
                  </span>
                )}
              </div>

              <div className="login-submit">
                <Button type="submit" variant="primary" size="lg" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <span className="login-loading">
                      <span className="login-spinner" aria-hidden="true" />
                      Entrando…
                    </span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        <Link to="/" className="back-link">
          &larr; Volver al inicio
        </Link>
      </main>
    </div>
  )
}

export default Login
