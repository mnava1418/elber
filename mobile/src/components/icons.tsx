import type { ReactNode } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { colors } from '../theme'

// The web's stroke icons (web/src/chat/icons.tsx), drawn with react-native-svg.
// Bring them over as the screens need them.
type IconProps = { size?: number; color?: string; strokeWidth?: number }

function icon(defaultSize: number, paths: ReactNode, defaultStroke = 1.8) {
  return function Icon({ size = defaultSize, color = colors.accent, strokeWidth = defaultStroke }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {paths}
      </Svg>
    )
  }
}

export const ChatIcon = icon(
  26,
  <>
    <Path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    <Path d="M8 10h8M8 13.5h5" />
  </>,
)

export const DiaryIcon = icon(
  26,
  <>
    <Path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6Z" />
    <Path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M10 8h5M10 11.5h5" />
  </>,
)

export const TrainingIcon = icon(26, <Path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />)

export const SendIcon = icon(16, <Path d="M5 12h14M13 6l6 6-6 6" />, 2.2)

export const LogoutIcon = icon(
  16,
  <>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="m16 17 5-5-5-5" />
    <Path d="M21 12H9" />
  </>,
)

// A chevron pointing left: the back button of the sections' screens.
export const BackIcon = icon(22, <Path d="m15 6-6 6 6 6" />, 2)

export const AlertIcon = icon(
  18,
  <>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 8v4.5M12 16h.01" />
  </>,
  2,
)

export const ClockIcon = icon(
  15,
  <>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 7v5l3 2" />
  </>,
  2,
)

export const RefreshIcon = icon(
  14,
  <>
    <Path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
    <Path d="M21 3v5h-5" />
  </>,
  2,
)

export const WifiOffIcon = icon(
  15,
  <>
    <Path d="M2 2l20 20" />
    <Path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <Path d="M5 12.9a10 10 0 0 1 5.2-2.8" />
    <Path d="M19 12.9a10 10 0 0 0-2.3-1.6" />
    <Path d="M12 20h.01" />
  </>,
  2,
)
