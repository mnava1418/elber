import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { Sora_600SemiBold, Sora_800ExtraBold } from '@expo-google-fonts/sora'
import { Platform } from 'react-native'

// The same weights the web loads from Google Fonts (web/index.html).
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Sora_600SemiBold,
  Sora_800ExtraBold,
}

// React Native doesn't pick a custom font's file from `fontWeight`: each
// weight is its own family, so styles use these instead of fontWeight.
export const fonts = {
  // --sans: body text.
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  // --display: titles, the wordmark, Elber's name.
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_800ExtraBold',
  // --mono: the system's monospace.
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const

export type FontName = keyof typeof fonts
