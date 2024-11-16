import React, { useContext, useRef } from 'react'
import { View, Text, Pressable } from 'react-native'
import { chatStyles } from '../../../../styles/chatStyles'
import { ChatMessageType } from '../../../../interfaces/app.interface'
import { GlobalContext } from '../../../../store/GlobalState'
import { setSelectedMeasure } from '../../../../store/actions/chat.actions'

type ChatMessageProps = {
    message: ChatMessageType
    showActions: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatMessage = ({message, showActions}: ChatMessageProps) => {
    const messageRef = useRef<View>(null)
    const {dispatch} = useContext(GlobalContext)

    const handleLongPress = () => {

        if (messageRef.current) {
            messageRef.current.measure((fx, fy, width, height, px, py) => {
                dispatch(setSelectedMeasure({height, px, py, pv: message.sender === 'user' ? 'right' : 'left'}))
            })

            showActions(true)
        }
    }

    return (
        <Pressable 
            style={({pressed}) => ([
                {
                    opacity: pressed ? 0.8 : 1.0
                }
            ])}
            onLongPress={handleLongPress}
        >
            <View
                ref={messageRef}
                style={[
                    chatStyles.messageContainer,
                message.sender === 'user' ? chatStyles.userMessage : chatStyles.botMessage,
            ]}>
                <Text style={chatStyles.messageText}>{message.message}</Text>
            </View>
        </Pressable>
    )
}

export default ChatMessage
