import { useEffect, useRef, useState } from 'react'
import { Logo } from '../components'
import type { ConnectionState } from './types'
import { LogoutIcon, MenuIcon } from './icons'

const STATUS: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  open: 'Conectado',
  reconnecting: 'Reconectando…',
  rejected: 'Sesión inválida',
}

interface Props {
  connection: ConnectionState
  user: { name: string; email: string }
  onOpenSidebar: () => void
  onLogout: () => void
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export function ChatHeader({ connection, user, onOpenSidebar, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="chat-header">
      <button type="button" className="chat-icon-btn chat-header-menu" aria-label="Abrir conversaciones" onClick={onOpenSidebar}>
        <MenuIcon />
      </button>
      <Logo size="sm" />
      <div className="chat-header-spacer" />
      <div className={`chat-status chat-status--${connection}`} role="status">
        <span className="chat-status-dot" aria-hidden="true" />
        {STATUS[connection]}
      </div>
      <div className="user-menu" ref={menuRef}>
        <button type="button" className="user-avatar" aria-label="Menú de usuario" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {initials(user.name)}
        </button>
        {open && (
          <div className="user-menu-panel" role="menu">
            <div className="user-menu-head">
              <div className="user-menu-name">{user.name}</div>
              <div className="user-menu-email">{user.email}</div>
            </div>
            <button type="button" role="menuitem" className="user-menu-item" onClick={onLogout}>
              <LogoutIcon />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
