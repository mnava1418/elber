import { useLocalSearchParams } from 'expo-router'
import ChatScreen from '../../../chat/ChatScreen'
import { CHAT } from '../../../chat/section'

// A saved conversation (e.g. one of Inicio's recent chats); new messages continue it.
export default function Conversation() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  // A new id is another conversation: a fresh screen, not one that switches.
  return <ChatScreen key={conversationId} section={CHAT} conversationId={conversationId} />
}
