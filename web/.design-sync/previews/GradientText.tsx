import { GradientText } from 'web'

export function Heading() {
  return (
    <h1 style={{ margin: 0 }}>
      Tu asistente personal
      <br />
      <GradientText>siempre a mano</GradientText>
    </h1>
  )
}

export function Inline() {
  return (
    <p>
      Organiza tu día con <GradientText>Elber</GradientText>.
    </p>
  )
}
