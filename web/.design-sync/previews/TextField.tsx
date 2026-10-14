import { useState } from 'react'
import { TextField } from 'web'

export function Email() {
  const [value, setValue] = useState('')
  return (
    <TextField
      label="Correo electrónico"
      type="email"
      placeholder="tu@correo.com"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export function Password() {
  const [value, setValue] = useState('')
  return (
    <TextField
      label="Contraseña"
      type="password"
      placeholder="••••••••"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export function Filled() {
  return (
    <TextField
      label="Correo electrónico"
      type="email"
      defaultValue="ana@elber.app"
      readOnly
    />
  )
}
