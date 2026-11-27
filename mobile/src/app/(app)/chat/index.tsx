import ChatScreen from '../../../chat/ChatScreen'
import { CHAT } from '../../../chat/section'

// A new conversation: the first message creates it.
export default function NewChat() {
  return <ChatScreen section={CHAT} />
}
