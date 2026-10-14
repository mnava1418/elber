import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
  }

  return (
    <main className="login">
      <div className="login-card">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" className="brand-mark" />
          <span>Elber</span>
        </Link>

        <h1>Iniciar sesión</h1>
        <p className="login-sub">Accede a tu asistente personal</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button type="submit" className="btn btn-primary">
            Iniciar sesión
          </button>
        </form>

        <Link to="/" className="back-link">
          &larr; Volver al inicio
        </Link>
      </div>
    </main>
  )
}

export default Login
