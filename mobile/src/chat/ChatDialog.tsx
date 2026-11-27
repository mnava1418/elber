import { Image, Modal, StyleSheet, View } from 'react-native'
import { Button, Text } from '../components'
import { chatColors, colors, shadows } from '../theme'

type ChatDialogProps = {
  title: string
  text: string
  action: { title: string; onPress: () => void }
}

// The chat's blocking dialogs, e.g. an invalid session (.chat-dialog):
// Elber surprised over a card with one way out.
export default function ChatDialog({ title, text, action }: ChatDialogProps) {
  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={action.onPress}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert" accessibilityViewIsModal>
          <Image source={require('../../assets/images/elber_surprise.webp')} style={styles.mascot} resizeMode="contain" />
          <Text font="display" size={22} color={colors.textHeading} style={styles.center} accessibilityRole="header">
            {title}
          </Text>
          <Text size={15} style={styles.center}>
            {text}
          </Text>
          <Button title={action.title} size="lg" onPress={action.onPress} style={styles.button} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: chatColors.dialogBackdrop },
  dialog: {
    width: '100%',
    maxWidth: 400,
    gap: 8,
    paddingTop: 64,
    paddingHorizontal: 28,
    paddingBottom: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: chatColors.composerLine,
    backgroundColor: chatColors.dialogBg,
    boxShadow: shadows.dialog,
  },
  mascot: { position: 'absolute', top: -54, width: 104, height: 104, alignSelf: 'center' },
  center: { textAlign: 'center' },
  button: { marginTop: 16 },
})
