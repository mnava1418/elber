import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../components'
import { MAX_CHARS, WARN_CHARS, type ConnectionState } from './types'
import { ClockIcon, SendIcon } from './icons'

interface Props {
  connection: ConnectionState
  responding: boolean
  onSend: (text: string) => void
  onStop: () => void
}

const fmt = (n: number) => n.toLocaleString('es-MX')

export function Composer({ connection, responding, onSend, onStop }: Props) {
  const [text, setText] = useState('')
  const [waitNotice, setWaitNotice] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const disabled = connection !== 'open'
  const len = text.length
  const over = len > MAX_CHARS
  const canSend = !disabled && !over && text.trim().length > 0

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  useEffect(() => {
    if (!waitNotice) return
    const id = window.setTimeout(() => setWaitNotice(false), 2500)
    return () => window.clearTimeout(id)
  }, [waitNotice])

  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  function submit() {
    if (responding) {
      if (text.trim()) setWaitNotice(true)
      return
    }
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  let hint = 'Enter para enviar · Shift + Enter para salto de línea'
  if (connection === 'connecting') hint = 'Conectando con Elber…'
  if (connection === 'reconnecting') hint = 'Sin conexión. Podrás escribir cuando Elber vuelva.'
  if (connection === 'rejected') hint = 'Inicia sesión de nuevo para seguir escribiendo.'
  if (!disabled && over) hint = `Tu mensaje supera el límite de ${fmt(MAX_CHARS)} caracteres. Acórtalo para enviarlo.`
  const keysHint = !disabled && !over

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        {/* Only while Elber answers: it disappears as soon as the answer ends. */}
        {waitNotice && responding && (
          <div className="composer-toast" role="status">
            <span>
              <ClockIcon />
              Espera a que termine la respuesta actual
            </span>
          </div>
        )}
        <form
          className={`composer${over ? ' composer--over' : ''}${disabled ? ' composer--disabled' : ''}`}
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <textarea
            ref={ref}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={disabled ? 'Esperando conexión…' : 'Escríbele a Elber…'}
            aria-label="Mensaje para Elber"
            aria-invalid={over}
            aria-describedby="composer-hint"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {responding ? (
            <Button type="button" variant="ghost" className="composer-btn" onClick={onStop}>
              <span className="composer-stop-square" aria-hidden="true" />
              Detener
            </Button>
          ) : (
            <Button type="submit" variant="primary" className="composer-btn" disabled={!canSend}>
              Enviar
              <SendIcon />
            </Button>
          )}
        </form>
        <div className="composer-meta">
          <span id="composer-hint" className={`composer-hint${over ? ' composer-hint--error' : ''}${keysHint ? ' composer-hint--keys' : ''}`}>
            {hint}
          </span>
          {len >= WARN_CHARS && (
            <span className={`composer-count${over ? ' composer-count--over' : ''}`} aria-live="polite">
              {fmt(len)} / {fmt(MAX_CHARS)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
