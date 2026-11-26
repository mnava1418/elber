import { useNavigate } from 'react-router-dom'
import { Button, GradientText, Logo } from '../components'
import { LogoutIcon } from '../chat/icons'
import { useAuth } from '../context/useAuth'
import { signOutUser } from '../services/auth.service'
import ChatCard from '../inicio/ChatCard'
import DiaryCard from '../inicio/DiaryCard'
import TrainingCard from '../inicio/TrainingCard'
import { longToday } from '../inicio/format'
import { useInicio } from '../inicio/useInicio'
import elberHappy from '../assets/elber_happy.webp'
import '../styles/Inicio.css'

// The dashboard: a card per section, each showing how the day goes there.
function Inicio() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { chat, diary, training } = useInicio()
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''

  const handleLogout = async () => {
    await signOutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="inicio">
      <header className="inicio-nav inicio-nav--wide">
        <Logo size="sm" />
        <Button variant="ghost" onClick={handleLogout} className="inicio-logout">
          <LogoutIcon />
          Cerrar sesión
        </Button>
      </header>

      <main className="inicio-main inicio-main--wide">
        <section className="dash-hero">
          <img src={elberHappy} alt="" className="dash-hero-mascot" />
          <div>
            <h1>
              Hola{name && <>, <GradientText>{name}</GradientText></>}
            </h1>
            <p className="inicio-sub">{longToday()} · Así va tu día.</p>
          </div>
        </section>

        <div className="dash-grid">
          <ChatCard state={chat} />
          <DiaryCard state={diary} />
          <TrainingCard state={training} />
        </div>
      </main>
    </div>
  )
}

export default Inicio
