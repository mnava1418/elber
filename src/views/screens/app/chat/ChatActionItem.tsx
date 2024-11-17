import React, { useContext } from 'react'
import { Pressable, View } from 'react-native'
import { ChatActionType } from '../../../../interfaces/app.interface'
import AppIcon from '../../../components/ui/AppIcon'
import CustomText from '../../../components/ui/CustomText'
import { chatStyles } from '../../../../styles/chatStyles'
import * as elberServices from '../../../../services/elber.service'
import { GlobalContext } from '../../../../store/GlobalState'
import { deleteMessageById } from '../../../../store/actions/chat.actions'

type ChatActionItemProps = {
    messageId: string
    action: ChatActionType
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatActionItem = ({action, messageId, setVisible}: ChatActionItemProps) => {
    const {dispatch} = useContext(GlobalContext)

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
        elberServices.deleteMessages(messageId)
        .then(() => {
            dispatch(deleteMessageById(messageId))
        })
        .catch((error: Error) => {
            console.error(error.message)
        })
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