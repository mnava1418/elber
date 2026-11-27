import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native'
import { brand } from '../theme'

// The three bouncing dots of "Pensando…" (.thinking-dots). Still when the
// user asked the system to reduce motion.
export default function ThinkingDots() {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.35)))

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null
    let cancelled = false
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return
      loop = Animated.loop(
        Animated.stagger(
          150,
          dots.map((dot) =>
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0.35, duration: 300, useNativeDriver: true }),
              Animated.delay(300),
            ]),
          ),
        ),
      )
      loop.start()
    })
    return () => {
      cancelled = true
      loop?.stop()
    }
  }, [dots])

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {dots.map((opacity, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity }]} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.cyan },
})
