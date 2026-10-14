import { Card } from 'web'

export function Default() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <h2 style={{ margin: '0 0 8px' }}>Recordatorio</h2>
      <p>Reunión con el equipo de producto a las 3:00 p.m.</p>
    </Card>
  )
}

export function TextHeavy() {
  return (
    <Card style={{ maxWidth: 400, textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 8px' }}>Resumen del día</h2>
      <p>
        Tienes 3 tareas pendientes, 1 recordatorio y una reunión programada
        para las 10:00 a.m. Elber priorizó automáticamente lo más urgente
        para que no se te escape nada importante.
      </p>
    </Card>
  )
}
