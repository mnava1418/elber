import { useLocalSearchParams } from 'expo-router'
import ComingSoon from '../../../components/ComingSoon'

// An existing conversation, opened from Inicio. The chat arrives in phase 5.
export default function Conversation() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  return <ComingSoon title="Chat" detail={`Conversación ${conversationId}`} />
}
