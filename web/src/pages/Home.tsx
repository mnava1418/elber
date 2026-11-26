import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, GradientText, Logo } from '../components'
import elber from '../assets/elber.png'
import elberHappy from '../assets/elber_happy.webp'
import elberThinking from '../assets/elber_thinking.webp'
import '../styles/Home.css'

const currentYear = new Date().getFullYear()

type Skill = { title: string; text: string; icon: ReactNode }

// The last card stands for everything else: Elber keeps learning new skills,
// so the landing names only a few and leaves the list open.
const SKILLS: Skill[] = [
  {
    title: 'Chat',
    text: 'Te respondo mientras escribo, busco en la web y te dejo las fuentes citadas para que las revises.',
    icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l.9-5.4A8 8 0 1 1 21 12z" />,
  },
  {
    title: 'Memoria',
    text: 'Recuerdo lo que me cuentas de ti, llevo tus pendientes y guardo tus ideas como notas enlazadas en tu vault de Obsidian.',
    icon: (
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V4.5A2.5 2.5 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0" />
    ),
  },
  {
    title: 'Bugs',
    text: 'Si algo de mí falla, cuéntamelo. Te hago las preguntas necesarias y abro el issue en GitHub cuando apruebas el borrador.',
    icon: (
      <path d="M8 9h8M8 13h8M9 3l1.5 2M15 3l-1.5 2M6 8a6 6 0 0 1 12 0v6a6 6 0 0 1-12 0zM3 11h3M18 11h3M3 17h3M18 17h3" />
    ),
  },
  {
    title: 'Y más…',
    text: 'Clima, diario, entrenamiento, llamadas de voz. Cada vez aprendo algo nuevo, y la lista sigue creciendo.',
    icon: <path d="M12 5v14M5 12h14" />,
  },
]

// Heights of the decorative voice wave, in px.
const WAVE = [10, 18, 26, 14, 30, 22, 12, 28, 32, 16, 24, 20, 30, 12, 26, 18, 10, 22, 28, 14, 20, 26, 12, 8]

function Home() {
  return (
    <div className="home">
      <header className="nav">
        <Link to="/" className="brand-link">
          <Logo size="sm" />
        </Link>
        <Button as={Link} to="/login" variant="ghost">
          Iniciar sesión
        </Button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Hola, soy <GradientText>Elber</GradientText>
            </h1>
            <p className="hero-sub">
              Platico contigo, recuerdo lo que te importa y cada vez aprendo algo nuevo: el clima,
              tus pendientes, tu diario, tu entrenamiento.
            </p>
            <div className="hero-actions">
              <Button as={Link} to="/login" variant="primary" size="lg">
                Iniciar sesión
              </Button>
              <Button as="a" href="#habilidades" variant="ghost" size="lg">
                Ver qué puedo hacer
              </Button>
            </div>
          </div>
          <div className="hero-art">
            <div className="home-glow home-glow--cyan" aria-hidden="true" />
            <div className="home-glow home-glow--orange" aria-hidden="true" />
            <img src={elber} alt="Elber" className="hero-mascot" />
          </div>
        </section>

        <section id="habilidades" className="home-section">
          <div className="section-head">
            <h2>Lo que puedo hacer</h2>
            <p>
              Cada habilidad es una herramienta real que uso mientras platicamos. Y la lista sigue
              creciendo.
            </p>
          </div>
          <ul className="skills">
            {SKILLS.map((skill) => (
              <li key={skill.title}>
                <Card className="skill">
                  <span className="skill-icon">
                    <svg
                      aria-hidden="true"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {skill.icon}
                    </svg>
                  </span>
                  <h3>{skill.title}</h3>
                  <p>{skill.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section">
          <div className="voice">
            <img src={elberThinking} alt="Elber escuchando" className="voice-mascot" />
            <div className="voice-copy">
              <h2>También me puedes llamar</h2>
              <p>
                Toca el teléfono en el chat o en el diario y habla. Te contesto en voz alta, frase
                por frase, y la plática se queda guardada en la conversación.
              </p>
              <div className="voice-wave" aria-hidden="true">
                {WAVE.map((height, i) => (
                  <span
                    key={i}
                    className={i % 5 === 2 ? 'voice-bar voice-bar--warm' : 'voice-bar'}
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section closing">
          <img src={elberHappy} alt="Elber contento" className="closing-mascot" />
          <h2>¿Platicamos?</h2>
          <p>Inicia sesión y retomamos donde nos quedamos.</p>
          <Button as={Link} to="/login" variant="primary" size="lg">
            Iniciar sesión
          </Button>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <Logo size="md" />
          <p>&copy; {currentYear} Elber</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
