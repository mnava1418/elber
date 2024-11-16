import React from 'react'
import { Pressable, View } from 'react-native'
import { ChatActionType } from '../../../../interfaces/app.interface'
import AppIcon from '../../../components/ui/AppIcon'
import CustomText from '../../../components/ui/CustomText'
import { chatStyles } from '../../../../styles/chatStyles'

type ChatActionItemProps = {
    messageId: string
    action: ChatActionType
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatActionItem = ({action, messageId, setVisible}: ChatActionItemProps) => {

    const handleAction = () => {
        switch (action.type) {
            case 'delete-message':
                deleteMessage()
                break;
            default:
                break;
        }

        setVisible(false)
    }

    const deleteMessage = () => {
        console.log('Vamos a borrar el mensaje', messageId )
    }

    return (
        <Pressable 
            style={({pressed}) => ([{opacity: pressed ? 0.8 : 1.0}])}
            onPress={handleAction}
        >
            <View style={chatStyles.chatAction}>
                <CustomText>{action.text}</CustomText>
                <AppIcon name={action.icon} size={30} />
            </View>
        </Pressable>
    )
}

export default ChatActionItem