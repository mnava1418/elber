import React, { useContext } from 'react'
import { Pressable, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { ChatActionType, ChatMessageType } from '../../../../interfaces/app.interface'
import AppIcon from '../../../components/ui/AppIcon'
import CustomText from '../../../components/ui/CustomText'
import { chatStyles } from '../../../../styles/chatStyles'
import * as elberServices from '../../../../services/elber.service'
import { GlobalContext } from '../../../../store/GlobalState'
import { deleteMessageById } from '../../../../store/actions/chat.actions'

type ChatActionItemProps = {
    message: ChatMessageType
    action: ChatActionType
    isLast: boolean
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatActionItem = ({action, message, isLast, setVisible}: ChatActionItemProps) => {
    const {dispatch} = useContext(GlobalContext)

    const handleAction = () => {
        switch (action.type) {
            case 'delete':
                deleteMessage()
                break
            case 'copy':
                copyMessage()
                break
            default:
                break;
        }

        setVisible(false)
    }

    const deleteMessage = () => {
        elberServices.deleteMessages(message.id)
        .then(() => {
            dispatch(deleteMessageById(message.id))
        })
        .catch((error: Error) => {
            console.error(error.message)
        })
    }

    const copyMessage = () => {
        Clipboard.setString(message.text)
    }

    return (
        <Pressable 
            style={({pressed}) => ([{opacity: pressed ? 0.8 : 1.0}])}
            onPress={handleAction}
        >
            <View style={[chatStyles.chatAction, {marginBottom: isLast ? 0 : 20 }]}>
                <CustomText>{action.text}</CustomText>
                <AppIcon name={action.icon} size={30} />
            </View>
        </Pressable>
    )
}

export default ChatActionItem