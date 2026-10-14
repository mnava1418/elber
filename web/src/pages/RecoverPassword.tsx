import { Link } from 'react-router-dom'
import { Button, Card, Logo } from '../components'
import '../styles/RecoverPassword.css'

function RecoverPassword() {
  return (
    <main className="recover">
      <Card className="recover-card">
        <Link to="/" className="brand-link">
          <Logo size="md" />
        </Link>
        <h1>Recuperar contraseña</h1>
        <p className="recover-sub">
          Esta sección todavía no está disponible. Mientras tanto, vuelve a
          iniciar sesión o contacta soporte.
        </p>
        <Button as={Link} to="/login" variant="primary">
          Volver a iniciar sesión
        </Button>
      </Card>
    </main>
  )
}

export default RecoverPassword
