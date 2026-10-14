import type { ComponentPropsWithoutRef, ElementType } from 'react'
import '../styles/components/Button.css'

type ButtonOwnProps = {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
}

type PolymorphicProps<T extends ElementType, Props> = Props &
  Omit<ComponentPropsWithoutRef<T>, keyof Props | 'as'> & { as?: T }

function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: PolymorphicProps<T, ButtonOwnProps>) {
  const Component = (as ?? 'button') as ElementType
  const classes = ['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : null, className]
    .filter(Boolean)
    .join(' ')

  return <Component className={classes} {...rest} />
}

export default Button
