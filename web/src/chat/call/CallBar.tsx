import { Button } from '../../components'
import { HangUpIcon } from '../icons'
import type { CallPhase } from './useCall'

const STATUS: Record<Exclude<CallPhase, 'off'>, string> = {
  listening: 'Te escucho…',
  thinking: 'Elber está pensando…',
  speaking: 'Elber está hablando',
}

interface Props {
  phase: Exclude<CallPhase, 'off'>
  /** The microphone is on: while listening, talking before this is lost. */
  ready: boolean
  heard: string
  problem: string | null
  onInterrupt: () => void
  onHangUp: () => void
}

// Takes the composer's place during a call.
export function CallBar({ phase, ready, heard, problem, onInterrupt, onHangUp }: Props) {
  const warming = phase === 'listening' && !ready
  let detail = 'Habla cuando quieras.'
  if (warming) detail = 'Espera el tono para hablar.'
  if (phase === 'listening' && heard) detail = heard
  if (phase === 'thinking') detail = heard
  if (phase === 'speaking') detail = 'Toca «Interrumpir» para hablar tú.'

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        {problem && (
          <div className="composer-toast" role="status">
            <span>{problem}</span>
          </div>
        )}
        <div className={`call call--${phase}${warming ? ' call--warming' : ''}`}>
          <span className="call-orb" aria-hidden="true">
            <span />
          </span>
          <div className="call-copy" aria-live="polite">
            <strong>{warming ? 'Un momento…' : STATUS[phase]}</strong>
            <span className={phase === 'listening' && heard ? 'call-heard' : undefined}>{detail}</span>
          </div>
          {phase !== 'listening' && (
            <Button type="button" variant="ghost" className="composer-btn" onClick={onInterrupt}>
              Interrumpir
            </Button>
          )}
          <button type="button" className="call-hangup" aria-label="Colgar" title="Colgar" onClick={onHangUp}>
            <HangUpIcon />
          </button>
        </div>
        <div className="composer-meta">
          <span className="composer-hint">Llamada con Elber · tus mensajes y sus respuestas quedan en el chat</span>
        </div>
      </div>
    </div>
  )
}
