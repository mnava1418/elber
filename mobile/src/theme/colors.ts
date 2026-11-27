// Colors of the app, from web/src/styles/tokens.css and the pages' overrides.
//
// Every web page (landing, login, inicio, chat, training, 404) overrides the
// light tokens with the same dark family "regardless of prefers-color-scheme",
// so the app has a single dark theme. If the web ever gets a real light mode,
// this is the place to add it.

// Brand palette (--elber-*).
export const brand = {
  primary: '#103b4a',
  secondary: '#087f8c',
  cyan: '#37d6d0',
  mint: '#d5fff8',
  orange: '#ff8b24',
}

// Semantic tokens, as the pages set them (.login, .inicio, .chat...).
export const colors = {
  text: '#9fd3ce',
  textHeading: brand.mint,
  // Quieter text for labels and dates, still 4.5:1 on surface (.inicio --text-muted).
  textMuted: '#8fc3c4',
  placeholder: '#5f8f97',
  surface: '#0e3442',
  // Sunken areas inside a surface (.inicio --well).
  well: 'rgba(5, 24, 32, 0.5)',
  border: 'rgba(55, 214, 208, 0.24)',
  accent: brand.cyan,
  accentBg: 'rgba(55, 214, 208, 0.16)',
  // Solid end of the screen gradient: what shows behind it (status bar, splash, overscroll).
  bg: '#051820',
  onBrand: brand.primary,
  error: 'rgba(255, 122, 110, 0.75)',
  errorText: '#ffa79c',
  errorBg: 'rgba(255, 122, 110, 0.16)',
}

// The login and password reset pages (web/src/styles/Login.css).
export const authColors = {
  card: 'rgba(14, 52, 66, 0.55)',
  cardBorder: 'rgba(213, 255, 248, 0.14)',
  alertBg: 'rgba(255, 107, 107, 0.1)',
  alertBorder: 'rgba(255, 120, 110, 0.4)',
  alertText: '#ffc2ba',
  alertIcon: '#ff7a6e',
  alertIconText: '#2a0b08',
  successBg: 'rgba(55, 214, 208, 0.14)',
  successBorder: 'rgba(55, 214, 208, 0.55)',
}

// The chat's own tokens (--chat-* on .chat in web/src/styles/Chat.css).
export const chatColors = {
  ink: '#cfeee9',
  inkStrong: '#effffc',
  muted: '#5f8f97',
  line: 'rgba(213, 255, 248, 0.1)',
  glass: 'rgba(10, 40, 52, 0.75)',
  error: '#ff7a6b',
  errorText: '#ffd9d3',
  warn: '#ffb877',
  warnText: '#ffd2a8',
}

// CSS gradients, which React Native draws natively through `backgroundImage`.
export const gradients = {
  // --brand-gradient.
  brand: `linear-gradient(120deg, ${brand.cyan}, ${brand.orange})`,
  // Background of the app's screens (.inicio, .chat).
  screen: 'radial-gradient(ellipse at 50% 30%, #0d3e4c 0%, #082733 50%, #051820 100%)',
  // The soft cyan halo behind the login card (.login-glow).
  glow: 'radial-gradient(circle, rgba(55, 214, 208, 0.22) 0%, rgba(55, 214, 208, 0.06) 40%, rgba(55, 214, 208, 0) 66%)',
}

// Stops of the logo's two flames (web/src/components/LogoMark.tsx).
export const logoStops = {
  cyan: ['#D5FFF8', '#37D6D0', '#087F8C'],
  orange: ['#FFB71A', '#FF8B24', '#FF5815'],
}

// --shadow of the dark family, as a CSS box-shadow (React Native supports the syntax).
export const shadows = {
  raised: '0 10px 30px -10px rgba(0, 0, 0, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  focusRing: `0 0 0 4px ${colors.accentBg}`,
  errorRing: '0 0 0 4px rgba(255, 122, 110, 0.16)',
  authCard: '0 24px 60px rgba(0, 0, 0, 0.45)',
  success: '0 0 32px rgba(55, 214, 208, 0.35)',
}
