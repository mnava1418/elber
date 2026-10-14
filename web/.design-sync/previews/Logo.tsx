import { Logo } from 'web'

export function Small() {
  return <Logo size="sm" />
}

export function Medium() {
  return <Logo size="md" />
}

export function IconOnly() {
  return <Logo size="lg" withWordmark={false} />
}
