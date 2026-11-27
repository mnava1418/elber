import type { ExpoConfig } from 'expo/config'

// TS instead of app.json so later phases can read env vars here (e.g. the EAS
// project id). The app's own variables are EXPO_PUBLIC_* and are validated in
// src/config/env.ts, not here.
const config: ExpoConfig = {
  name: 'Elber',
  slug: 'elber',
  scheme: 'elber',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // The app is always dark, like every page of the web (see src/theme/colors.ts).
  userInterfaceStyle: 'dark',
  ios: {
    bundleIdentifier: 'tech.namart.elber',
    supportsTablet: false,
  },
  android: {
    package: 'tech.namart.elber',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-font',
    // Placeholder image until the real splash and icon (phase 15). The color is
    // colors.bg, the dark end of the screens' gradient, so there's no flash.
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 160, backgroundColor: '#051820' }],
  ],
  experiments: {
    typedRoutes: true,
  },
}

export default config
