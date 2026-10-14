import { Link } from 'react-router-dom'
import { Button, GradientText, Logo } from '../components'
import elber from '../assets/elber.png'
import '../styles/Home.css'

const currentYear = new Date().getFullYear()

function Home() {
  return (
    <div className="home">
      <div className="home-glow home-glow--cyan" aria-hidden="true" />
      <div className="home-glow home-glow--orange" aria-hidden="true" />
      <span className="home-spark home-spark--1" aria-hidden="true" />
      <span className="home-spark home-spark--2" aria-hidden="true" />
      <span className="home-spark home-spark--3" aria-hidden="true" />
      <span className="home-spark home-spark--4" aria-hidden="true" />

      <header className="nav">
        <Link to="/" className="brand-link">
          <Logo size="sm" />
        </Link>
        <Button as={Link} to="/login" variant="ghost" className="nav-login">
          Iniciar sesión
        </Button>
      </header>

      <main className="hero">
        <img src={elber} alt="Elber" className="hero-mascot" />
        <h1>
          Hola, soy <GradientText>Elber</GradientText>
        </h1>
        <p className="hero-sub">
          Tu asistente personal para las tareas de todos los días.
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
    </div>
  )
}

export default Home
