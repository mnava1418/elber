import { Link } from 'react-router-dom'
import { Button, GradientText, Logo } from '../components'
import '../styles/Home.css'

const currentYear = new Date().getFullYear()

function Home() {
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand-link">
          <Logo size="sm" />
        </Link>
        <Button as={Link} to="/login" variant="ghost">
          Iniciar sesión
        </Button>
      </header>

      <main className="hero">
        <Logo size="lg" withWordmark={false} className="hero-mark" />
        <h1>
          Tu asistente personal
          <br />
          <GradientText>siempre a mano</GradientText>
        </h1>
        <p className="hero-sub">
          Elber te ayuda a organizar tu día, recordar lo importante y resolver
          tareas sin esfuerzo.
        </p>
        <div className="hero-actions">
          <Button as={Link} to="/login" variant="primary" size="lg">
            Iniciar sesión
          </Button>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {currentYear} Elber</p>
      </footer>
    </>
  )
}

export default Home
