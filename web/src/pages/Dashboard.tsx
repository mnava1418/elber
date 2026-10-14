import { useNavigate } from 'react-router-dom'
import { Button, Card, Logo } from '../components'
import { useAuth } from '../context/useAuth'
import { signOutUser } from '../services/auth.service'
import '../styles/Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOutUser()
    navigate('/login')
  }

  return (
    <main className="dashboard">
      <Card className="dashboard-card">
        <Logo size="md" />
        <h1>Bienvenido{user?.email ? `, ${user.email}` : ''}</h1>
        <p className="dashboard-sub">Tu panel de Elber está en construcción.</p>
        <Button variant="ghost" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </Card>
    </main>
  )
}

export default Dashboard
