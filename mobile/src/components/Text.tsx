import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { colors, fonts, type FontName } from '../theme'

export type TextProps = RNTextProps & {
  font?: FontName
  color?: string
  size?: number
}

// React Native doesn't inherit fonts from parents the way CSS does, so every
// text goes through this one to get the app's font and color.
export default function Text({ font = 'regular', color = colors.text, size = 16, style, ...rest }: TextProps) {
  return <RNText style={[{ fontFamily: fonts[font], color, fontSize: size, lineHeight: size * 1.5 }, style]} {...rest} />
}
