import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Logo, Screen, Text } from '../components'
import { authColors, colors, gradients, shadows } from '../theme'

type AuthLayoutProps = {
  title: string
  subtitle: string
  // The text link under the card, e.g. "← Volver al inicio".
  back: { label: string; href: '/' | '/login' }
  children: ReactNode
}

// The look shared by the login and password reset pages (web/src/styles/Login.css):
// a glass card with Elber peeking over its top edge.
export default function AuthLayout({ title, subtitle, back, children }: AuthLayoutProps) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(back.href))

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={styles.content}>
        <View style={styles.nav}>
          <Logo size="sm" />
        </View>

        <View style={styles.main}>
          <View style={styles.glow} pointerEvents="none" />
          <View style={styles.card}>
            <Image source={require('../../assets/images/elber.png')} style={styles.mascot} resizeMode="contain" />
            <View style={styles.head}>
              <Text font="display" size={26} color={colors.textHeading} style={styles.center} accessibilityRole="header">
                {title}
              </Text>
              <Text size={15} style={styles.center}>
                {subtitle}
              </Text>
            </View>
            {children}
          </View>

          <Pressable accessibilityRole="link" onPress={goBack} hitSlop={8} style={styles.back}>
            <Text size={14}>← {back.label}</Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

// The red box above the form (.login-alert).
export function AuthAlert({ message }: { message: string }) {
  return (
    <View style={styles.alert} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.alertIcon}>
        <Text font="semibold" size={12} color={authColors.alertIconText}>
          !
        </Text>
      </View>
      <Text size={14} color={authColors.alertText} style={styles.flex}>
        {message}
      </Text>
    </View>
  )
}

// The check mark and message after a successful request (.login-success).
export function AuthSuccess({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.success} accessibilityLiveRegion="polite">
      <View style={styles.successIcon}>
        <Text size={26} color={colors.accent}>
          ✓
        </Text>
      </View>
      <Text font="display" size={20} color={colors.textHeading}>
        {title}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { paddingHorizontal: 16 },
  nav: { paddingHorizontal: 8, paddingVertical: 12 },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 72, paddingBottom: 24 },
  glow: {
    position: 'absolute',
    width: 520,
    height: 520,
    top: '50%',
    marginTop: -260,
    alignSelf: 'center',
    backgroundImage: gradients.glow,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    gap: 18,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    backgroundColor: authColors.card,
    boxShadow: shadows.authCard,
  },
  mascot: { position: 'absolute', top: -62, width: 112, height: 112, alignSelf: 'center' },
  head: { gap: 8, marginBottom: 10 },
  back: { padding: 12 },
  alert: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.alertBorder,
    backgroundColor: authColors.alertBg,
  },
  alertIcon: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authColors.alertIcon,
  },
  success: { alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 4 },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authColors.successBorder,
    backgroundColor: authColors.successBg,
    boxShadow: shadows.success,
  },
})
