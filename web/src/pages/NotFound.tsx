import { Link } from 'react-router-dom'
import { Button, Card, GradientText, Logo } from '../components'
import '../styles/NotFound.css'

function NotFound() {
  return (
    <main className="not-found">
      <Card className="not-found-card">
        <Link to="/" className="brand-link">
          <Logo size="md" />
        </Link>
        <p className="not-found-code">
          <GradientText>404</GradientText>
        </p>
        <h1>Página no encontrada</h1>
        <p className="not-found-sub">
          La página que buscas no existe o fue movida.
        </p>
        <Button as={Link} to="/" variant="primary">
          Volver al inicio
        </Button>
      </Card>
    </main>
  )
}

export default NotFound
