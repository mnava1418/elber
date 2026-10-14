import { Link } from 'react-router-dom'
import { Button, Logo } from '../components'
import elberSurprise from '../assets/elber_surprise.png'
import '../styles/NotFound.css'

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-echo" aria-hidden="true">404</div>
      <div className="not-found-glow" aria-hidden="true" />
      <span className="not-found-spark not-found-spark--1" aria-hidden="true" />
      <span className="not-found-spark not-found-spark--2" aria-hidden="true" />
      <span className="not-found-spark not-found-spark--3" aria-hidden="true" />

      <header className="not-found-nav">
        <Link to="/" className="brand-link">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="not-found-main">
        <img src={elberSurprise} alt="Elber sorprendido" className="not-found-mascot" />
        <p className="not-found-code">ERROR 404</p>
        <h1>Esta página se nos perdió</h1>
        <p className="not-found-sub">
          Busqué por todos lados y no la encontré. Puede que no exista o que la hayan movido.
        </p>
        <div className="not-found-actions">
          <div className="not-found-primary">
            <Button as={Link} to="/" variant="primary" size="lg">
              Volver al inicio
            </Button>
          </div>
          <Button as={Link} to="/login" variant="ghost" size="lg">
            Iniciar sesión
          </Button>
        </div>
      </main>
    </div>
  )
}

export default NotFound
