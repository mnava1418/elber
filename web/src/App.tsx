import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import RecoverPassword from './pages/RecoverPassword'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<RecoverPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
