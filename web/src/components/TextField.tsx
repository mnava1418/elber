import { useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import '../styles/components/TextField.css'

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
}

function TextField({ label, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...rest} />
    </div>
  )
}

export default TextField
