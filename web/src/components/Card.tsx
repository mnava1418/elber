import type { ComponentPropsWithoutRef } from 'react'
import '../styles/components/Card.css'

type CardProps = ComponentPropsWithoutRef<'div'>

function Card({ className, ...rest }: CardProps) {
  return <div className={['card', className].filter(Boolean).join(' ')} {...rest} />
}

export default Card
