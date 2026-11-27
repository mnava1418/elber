import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, type DimensionValue } from 'react-native'
import { colors } from '../theme'

type SkeletonProps = { height: number; width?: DimensionValue; radius?: number; marginTop?: number }

// A pulsing placeholder while something loads (.dash-skeleton). Still when
// the user asked the system to reduce motion.
export default function Skeleton({ height, width = '100%', radius = 8, marginTop }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.6))

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null
    let cancelled = false
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ]),
      )
      loop.start()
    })
    return () => {
      cancelled = true
      loop?.stop()
    }
  }, [opacity])

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height, width, borderRadius: radius, marginTop, opacity, backgroundColor: colors.skeleton }}
    />
  )
}
