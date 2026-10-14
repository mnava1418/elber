import { Link } from 'react-router-dom'
import '../styles/Home.css'

const currentYear = new Date().getFullYear()

function Home() {
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" className="brand-mark" />
          <span>Elber</span>
        </Link>
        <Link to="/login" className="btn btn-ghost">
          Iniciar sesión
        </Link>
      </header>

      <main className="hero">
        <img src="/favicon.svg" alt="Logo de Elber" className="hero-mark" />
        <h1>
          Tu asistente personal
          <br />
          <span className="gradient-text">siempre a mano</span>
        </h1>
        <p className="hero-sub">
          Elber te ayuda a organizar tu día, recordar lo importante y resolver
          tareas sin esfuerzo.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {currentYear} Elber</p>
      </footer>
    </>
  )
}

export default Home
