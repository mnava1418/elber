import type { ComponentType, SVGProps } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, GradientText, Logo } from '../components'
import { ChatIcon, DiaryIcon, LogoutIcon, TrainingIcon } from '../chat/icons'
import { useAuth } from '../context/useAuth'
import { signOutUser } from '../services/auth.service'
import '../styles/Inicio.css'

interface Section {
  path: string
  title: string
  description: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

// The app's sections, one card each. A new section only needs its entry here.
const SECTIONS: Section[] = [
  { path: '/chat', title: 'Chat', description: 'Clima, notas, pendientes y lo que se te ocurra.', Icon: ChatIcon },
  { path: '/diario', title: 'Diario', description: '¿Cómo te fue hoy? Platícalo y guárdalo en tu diario.', Icon: DiaryIcon },
  { path: '/entrenamiento', title: 'Entrenamiento', description: 'Tu plan, tu racha y el día de hoy. Elber es tu coach.', Icon: TrainingIcon },
]

function Inicio() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''

  const handleLogout = async () => {
    await signOutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="inicio">
      <header className="inicio-nav">
        <Logo size="sm" />
        <Button variant="ghost" onClick={handleLogout} className="inicio-logout">
          <LogoutIcon />
          Cerrar sesión
        </Button>
      </header>

      <main className="inicio-main">
        <h1>
          Hola{name && <>, <GradientText>{name}</GradientText></>}
        </h1>
        <p className="inicio-sub">¿Qué hacemos hoy?</p>

        <nav className="inicio-sections" aria-label="Secciones">
          {SECTIONS.map(({ path, title, description, Icon }) => (
            <Link key={path} to={path} className="card inicio-section">
              <Icon className="inicio-section-icon" />
              <span className="inicio-section-title">{title}</span>
              <span className="inicio-section-desc">{description}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}

export default Inicio
