import type { ReactNode, SVGProps } from 'react'

// OpenWeather's icon codes ("10d": rain, day) as line icons, in the style of
// ../icons.tsx. https://openweathermap.org/weather-conditions
type Kind = 'clear' | 'partly' | 'clouds' | 'rain' | 'storm' | 'snow' | 'mist'

const KIND: Record<string, Kind> = {
  '01': 'clear',
  '02': 'partly',
  '03': 'clouds',
  '04': 'clouds',
  '09': 'rain',
  '10': 'rain',
  '11': 'storm',
  '13': 'snow',
  '50': 'mist',
}

const sun = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </>
)
const moon = <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
const cloud = <path d="M7 19h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 10.5 4.25 4.25 0 0 0 7 19Z" />
// Smaller cloud, lower right, for "partly cloudy". Filled with the card's
// background so it hides the sun behind it.
const smallCloud = <path d="M10 20h8a3.2 3.2 0 0 0 .4-6.38A4.8 4.8 0 0 0 9.2 13.6 3.4 3.4 0 0 0 10 20Z" fill="var(--wx-bg)" />
// Cloud raised to leave room for rain, snow or lightning below.
const highCloud = <path d="M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 6.5 4.25 4.25 0 0 0 7 15Z" />

const DRAW: Record<Kind, (night: boolean) => ReactNode> = {
  clear: (night) => (night ? moon : sun),
  partly: (night) => (
    <>
      <g transform="translate(-3.5 -3.5) scale(0.8)">{night ? moon : sun}</g>
      {smallCloud}
    </>
  ),
  clouds: () => cloud,
  rain: () => (
    <>
      {highCloud}
      <path d="M8.5 18l-1 3M12.5 18l-1 3M16.5 18l-1 3" />
    </>
  ),
  storm: () => (
    <>
      {highCloud}
      <path d="m12.5 15-2 3.5h3l-2 3.5" />
    </>
  ),
  snow: () => (
    <>
      {highCloud}
      <path d="M8.5 19h.01M12 21h.01M15.5 19h.01" strokeWidth={2.6} />
    </>
  ),
  mist: () => <path d="M4 9h16M3 13h18M5 17h14" />,
}

interface Props extends SVGProps<SVGSVGElement> {
  code: string
  size?: number
}

export function WeatherIcon({ code, size = 24, className = '', ...props }: Props) {
  const kind = KIND[code.slice(0, 2)] ?? 'clouds'
  const night = code.endsWith('n')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`wx-icon wx-icon--${kind}${night ? ' wx-icon--night' : ''} ${className}`}
      {...props}
    >
      {DRAW[kind](night)}
    </svg>
  )
}
