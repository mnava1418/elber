import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Logo, TextField } from '../components'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
  }

  return (
    <main className="login">
      <Card className="login-card">
        <Link to="/" className="brand-link">
          <Logo size="md" />
        </Link>

        <h1>Iniciar sesión</h1>
        <p className="login-sub">Accede a tu asistente personal</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <TextField
            label="Correo electrónico"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />

          <TextField
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" className="login-submit">
            Iniciar sesión
          </Button>
        </form>

        <Link to="/" className="back-link">
          &larr; Volver al inicio
        </Link>
      </Card>
    </main>
  )
}

export default Login
