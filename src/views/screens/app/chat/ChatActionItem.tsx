import React, { useContext } from 'react'
import { Pressable, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { ChatActionType, ChatMessageType } from '../../../../interfaces/app.interface'
import AppIcon from '../../../components/ui/AppIcon'
import CustomText from '../../../components/ui/CustomText'
import { chatStyles } from '../../../../styles/chatStyles'
import * as elberServices from '../../../../services/elber.service'
import { GlobalContext } from '../../../../store/GlobalState'
import { deleteMessageById, setIsFavoriteMessage } from '../../../../store/actions/chat.actions'
import Share from 'react-native-share';

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
            case 'share':
                shareMessage()
                break
            case 'favorite':
                setFavorite()
                break
            default:
                break;
        }

        setVisible(false)
    }

    const deleteMessage = () => {
        dispatch(deleteMessageById(message.id))
        elberServices.deleteMessages(message.id)        
        .catch((error: Error) => {
            console.error(error.message)
        })
    }

    const copyMessage = () => {
        Clipboard.setString(message.text)
    }

    const setFavorite = () => {
        dispatch(setIsFavoriteMessage(message.id))
        elberServices.setIsFavorite(message.id, !message.isFavorite)        
        .catch((error: Error) => {
            console.error(error.message)
        })
    }

    const shareMessage = async () => {
        await Share.open({
            message: message.text
        })
        .catch((error: Error) => {            
        })
    }

    return (
        <Pressable 
            style={({pressed}) => ([{opacity: pressed ? 0.8 : 1.0}])}
            onPress={handleAction}
        >
            <View style={[chatStyles.chatAction, {marginBottom: isLast ? 0 : 20 }]}>
                <CustomText>{action.type === 'favorite' && message.isFavorite ? `No ${action.text}`: action.text}</CustomText>
                <AppIcon name={action.type === 'favorite' && message.isFavorite ? 'star': action.icon} size={24} />
            </View>
        </Pressable>
    )
}

export default ChatActionItem