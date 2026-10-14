import LogoMark from './LogoMark'
import '../styles/components/Logo.css'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  withWordmark?: boolean
  alt?: string
  className?: string
}

function Logo({ size = 'sm', withWordmark = true, alt, className }: LogoProps) {
  const classes = ['logo', `logo--${size}`, className].filter(Boolean).join(' ')
  const label = alt ?? (withWordmark ? undefined : 'Logo de Elber')

  return (
    <span className={classes} {...(label ? { role: 'img', 'aria-label': label } : {})}>
      <LogoMark className="logo-mark" />
      {withWordmark && <span className="logo-wordmark">Elber</span>}
    </span>
  )
}

export default Logo
