import type { ReactElement, ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { colors, gradients } from '../theme'

type ScreenProps = {
  children: ReactNode
  // Scrolls its content (most screens); off for screens that manage their own lists.
  scroll?: boolean
  edges?: Edge[]
  contentStyle?: StyleProp<ViewStyle>
  // Pull to refresh, for scrolling screens.
  refreshControl?: ReactElement<RefreshControlProps>
}

// The dark gradient background every web page has, inside the safe area.
export default function Screen({ children, scroll = true, edges = ['top', 'bottom'], contentStyle, refreshControl }: ScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.safe, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, backgroundImage: gradients.screen },
  safe: { flex: 1 },
  content: { flexGrow: 1, padding: 16 },
})
