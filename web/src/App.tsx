import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import GuestRoute from './routes/GuestRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import RecoverPassword from './pages/RecoverPassword'
import Chat from './pages/Chat'
import { CHAT, DIARY } from './chat/section'
import Inicio from './pages/Inicio'
import Training from './pages/Training'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <Home />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/reset"
            element={
              <GuestRoute>
                <RecoverPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <Inicio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId?"
            element={
              <ProtectedRoute>
                <Chat key="chat" section={CHAT} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diario/:conversationId?"
            element={
              <ProtectedRoute>
                <Chat key="diary" section={DIARY} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entrenamiento"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
