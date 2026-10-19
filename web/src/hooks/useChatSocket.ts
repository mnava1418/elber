import { useCallback, useEffect, useRef, useState } from 'react'
import { createChatSocket, type ChatSocket } from '../lib/socket'

export type ChatStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type ChatMessage = {
  id: number
  from: 'me' | 'elber'
  text: string
}

// Connects to /chat while the component is mounted.
export function useChatSocket() {
  const socketRef = useRef<ChatSocket | null>(null)
  const nextId = useRef(0)
  const [status, setStatus] = useState<ChatStatus>('connecting')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const addMessage = useCallback((from: ChatMessage['from'], text: string) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, from, text }])
  }, [])

  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setStatus('connected')
      setError('')
    })
    socket.on('disconnect', () => setStatus('disconnected'))
    // Rejected by the backend auth middleware, or the server is unreachable.
    // When the backend rejects it, Socket.IO does not retry on its own.
    socket.on('connect_error', (err) => {
      setStatus('error')
      setError(socket.active ? 'No se pudo conectar con Elber, reintentando…' : `Conexión rechazada: ${err.message}`)
    })
    socket.on('chat:hello', ({ text }) => addMessage('elber', text))

    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [addMessage])

  const sendHello = useCallback(
    (text: string) => {
      const socket = socketRef.current
      if (!socket?.connected) return
      addMessage('me', text)
      socket.emit('chat:hello', { text })
    },
    [addMessage],
  )

  return { status, error, messages, sendHello }
}
