import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Button, Card, GradientText, Logo, Screen, Text, TextField } from '../components'
import { brand, chatColors, colors } from '../theme'

const MASCOTS = [
  { name: 'elber', source: require('../../assets/images/elber.webp') },
  { name: 'happy', source: require('../../assets/images/elber_happy.webp') },
  { name: 'thinking', source: require('../../assets/images/elber_thinking.webp') },
  { name: 'surprise', source: require('../../assets/images/elber_surprise.webp') },
  { name: 'login (png)', source: require('../../assets/images/elber.png') },
]

const SWATCHES = [
  ...Object.entries(brand).map(([name, value]) => ({ name: `brand.${name}`, value })),
  ...Object.entries(colors).map(([name, value]) => ({ name: `colors.${name}`, value })),
  ...Object.entries(chatColors).map(([name, value]) => ({ name: `chat.${name}`, value })),
]

// Every base component in one place, to compare with the web. Development only.
export default function Catalog() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!__DEV__) return <Redirect href="/" />

  return (
    <Screen contentStyle={styles.content}>
      <Button title="← Volver" variant="ghost" onPress={() => router.back()} style={styles.back} />

      <Section title="Tipografía">
        <Text font="displayBold" size={32} color={colors.textHeading}>
          Sora 800 · Título
        </Text>
        <Text font="display" size={22} color={colors.textHeading}>
          Sora 600 · Subtítulo
        </Text>
        <Text font="semibold">Inter 600 · Etiqueta</Text>
        <Text font="medium">Inter 500 · Texto medio</Text>
        <Text>Inter 400 · Texto normal. ¿Cómo te fue hoy? Ñandú, acción, pingüino.</Text>
        <Text size={13} color={colors.textMuted}>
          Texto apagado · fechas y etiquetas
        </Text>
        <Text font="mono" size={14}>
          {'const elber = "mono"'}
        </Text>
        <GradientText font="displayBold" size={32}>
          Texto con degradado
        </GradientText>
      </Section>

      <Section title="Logo">
        <View style={styles.row}>
          <Logo size="sm" />
          <Logo size="md" />
        </View>
        <Logo size="lg" withWordmark={false} />
      </Section>

      <Section title="Botones">
        <Button title="Primario" onPress={() => {}} />
        <Button title="Primario grande" size="lg" onPress={() => {}} />
        <Button title="Fantasma" variant="ghost" onPress={() => {}} />
        <Button title="Deshabilitado" disabled />
        <Button title="Cargando" loading />
      </Section>

      <Section title="Campos">
        <TextField
          label="Correo electrónico"
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField label="Contraseña" placeholder="••••••••" password value={password} onChangeText={setPassword} />
        <TextField label="Con error" defaultValue="no-es-un-correo" error="Escribe un correo válido" />
      </Section>

      <Section title="Tarjeta">
        <Card>
          <Text font="display" size={18} color={colors.textHeading}>
            Una tarjeta
          </Text>
          <Text>Fondo surface, borde y sombra como en la web.</Text>
        </Card>
      </Section>

      <Section title="Elber">
        <View style={styles.row}>
          {MASCOTS.map((m) => (
            <View key={m.name} style={styles.mascot}>
              <Image source={m.source} style={styles.mascotImage} resizeMode="contain" />
              <Text size={12} color={colors.textMuted}>
                {m.name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Colores">
        {SWATCHES.map((s) => (
          <View key={s.name} style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: s.value }]} />
            <Text size={13}>{s.name}</Text>
            <Text size={12} color={colors.textMuted}>
              {s.value}
            </Text>
          </View>
        ))}
      </Section>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text font="display" size={14} color={colors.textMuted}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { gap: 32, paddingBottom: 48 },
  back: { alignSelf: 'flex-start' },
  section: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  mascot: { alignItems: 'center', gap: 4 },
  mascotImage: { width: 64, height: 64 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
})
