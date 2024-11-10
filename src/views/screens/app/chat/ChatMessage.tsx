import React from 'react'
import { View, Text } from 'react-native'
import { chatStyles } from '../../../../styles/chatStyles'
import { ChatMessageType } from '../../../../interfaces/app.interface'

type ChatMessageProps = {
    message: ChatMessageType
}

const ChatMessage = ({message}: ChatMessageProps) => {
    return (
        <View
            style={[
                chatStyles.messageContainer,
            message.sender === 'user' ? chatStyles.userMessage : chatStyles.botMessage,
        ]}>
            <Text style={chatStyles.messageText}>{message.message}</Text>
        </View>
    )
}

export default ChatMessage