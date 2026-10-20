import { useCallback, useEffect, useRef, useState } from 'react'
import { createChatSocket, type ChatSocket } from '../lib/socket'

export type ChatStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type ChatMessage = {
  id: number
  from: 'me' | 'elber'
  text: string
}

// What Elber is doing with the answer in progress, if any.
export type Activity = { kind: 'thinking' } | { kind: 'tool'; name: string; detail?: string } | null

// Connects to /chat while the component is mounted.
export function useChatSocket() {
  const socketRef = useRef<ChatSocket | null>(null)
  const nextId = useRef(0)
  const [status, setStatus] = useState<ChatStatus>('connecting')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activity, setActivity] = useState<Activity>(null)
  // From chat:message until chat:done / chat:error: the backend takes one at a time.
  const [answering, setAnswering] = useState(false)

  const addMessage = useCallback((from: ChatMessage['from'], text: string) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, from, text }])
  }, [])

  // Appends to Elber's answer in progress, or starts it.
  const appendToAnswer = useCallback((text: string) => {
    setMessages((prev) => {
      const last = prev.at(-1)
      if (last?.from === 'elber') {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }]
      }
      return [...prev, { id: nextId.current++, from: 'elber', text }]
    })
  }, [])

  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setStatus('connected')
      setError('')
    })
    socket.on('disconnect', () => {
      setStatus('disconnected')
      // The server aborts the answer when the connection drops.
      setActivity(null)
      setAnswering(false)
    })
    // Rejected by the backend auth middleware, or the server is unreachable.
    // When the backend rejects it, Socket.IO does not retry on its own.
    socket.on('connect_error', (err) => {
      setStatus('error')
      setError(socket.active ? 'No se pudo conectar con Elber, reintentando…' : `Conexión rechazada: ${err.message}`)
    })

    socket.on('chat:delta', ({ text }) => {
      setActivity(null)
      appendToAnswer(text)
    })
    socket.on('chat:tool', ({ name, detail }) => setActivity({ kind: 'tool', name, detail }))
    socket.on('chat:done', () => {
      setActivity(null)
      setAnswering(false)
    })
    socket.on('chat:error', ({ message }) => {
      setActivity(null)
      setAnswering(false)
      setError(message)
    })

    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [appendToAnswer])

  const sendMessage = useCallback(
    (text: string) => {
      const socket = socketRef.current
      if (!socket?.connected) return
      setError('')
      addMessage('me', text)
      setActivity({ kind: 'thinking' })
      setAnswering(true)
      socket.emit('chat:message', { text })
    },
    [addMessage],
  )

  const cancel = useCallback(() => {
    socketRef.current?.emit('chat:cancel')
  }, [])

  return { status, error, messages, activity, answering, sendMessage, cancel }
}
