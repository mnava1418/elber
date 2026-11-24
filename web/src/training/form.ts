// The forms keep numbers as the text typed, so a field can be empty while
// editing; they become numbers (or null) only when saved.
export const numberText = (value: number | null) => (value === null ? '' : String(value))

export function toNumber(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'))
  return text.trim() === '' || Number.isNaN(value) ? null : value
}

export const toText = (text: string) => text.trim() || null
