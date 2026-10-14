import { Button } from 'web'

export function Primary() {
  return <Button variant="primary">Iniciar sesión</Button>
}

export function Ghost() {
  return <Button variant="ghost">Cancelar</Button>
}

export function Large() {
  return (
    <Button variant="primary" size="lg">
      Crear cuenta
    </Button>
  )
}

export function Disabled() {
  return (
    <Button variant="primary" disabled>
      Procesando…
    </Button>
  )
}
