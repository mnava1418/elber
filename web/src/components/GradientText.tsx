import type { ComponentPropsWithoutRef, ElementType } from 'react'
import '../styles/components/GradientText.css'

type GradientTextProps<T extends ElementType> = { as?: T } & Omit<ComponentPropsWithoutRef<T>, 'as'>

function GradientText<T extends ElementType = 'span'>({
  as,
  className,
  ...rest
}: GradientTextProps<T>) {
  const Component = (as ?? 'span') as ElementType
  return <Component className={['gradient-text', className].filter(Boolean).join(' ')} {...rest} />
}

export default GradientText
