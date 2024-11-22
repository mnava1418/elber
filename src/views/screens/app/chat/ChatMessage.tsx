import React, { useContext, useRef } from 'react'
import { View, Text, Pressable } from 'react-native'
import { chatStyles } from '../../../../styles/chatStyles'
import { ChatMessageType } from '../../../../interfaces/app.interface'
import { GlobalContext } from '../../../../store/GlobalState'
import { setSelectedMeasure, setShowFavorites } from '../../../../store/actions/chat.actions'
import AppIcon from '../../../components/ui/AppIcon'
import { selectShowFavorites } from '../../../../store/selectors/chat.selector'

type ChatMessageProps = {
    index: number
    message: ChatMessageType
    showActions: React.Dispatch<React.SetStateAction<boolean>>
    scrollToMessage: (index: number) => void
}

const ChatMessage = ({index, message, showActions, scrollToMessage}: ChatMessageProps) => {
    const messageRef = useRef<View>(null)
    const {state, dispatch} = useContext(GlobalContext)
    const showFavorites = selectShowFavorites(state.chat)

    const handleLongPress = () => {
        if (messageRef.current) {
            messageRef.current.measure((fx, fy, width, height, px, py) => {
                dispatch(setSelectedMeasure({
                    layout: {height, px, py, pv: message.sender === 'user' ? 'right' : 'left'}, 
                    content: message
                }))
            })

            showActions(true)
        }
    }

    const handlePress = () => {
        if(showFavorites) {
            dispatch(setShowFavorites())
            setTimeout(() => {
                scrollToMessage(index)
            }, 200)
        }
    }

    const generateMessage = () => {
        if((showFavorites && message.isFavorite) || !showFavorites) {
            return(
                <Pressable 
                    style={({pressed}) => ([
                        {
                            opacity: pressed ? 0.8 : 1.0
                        }
                    ])}
                    onLongPress={handleLongPress}
                    onPress={handlePress}
                >
                    <View style={[{flex: 1, flexDirection: 'row', justifyContent: message.sender === 'bot' ? 'flex-start' : 'flex-end'}]}>
                        <View 
                            ref={messageRef}
                            style={[
                                chatStyles.messageContainer,
                                message.sender === 'user' ? chatStyles.userMessage : chatStyles.botMessage
                            ]}
                        >
                            <View style={{flexShrink: 1}}>
                                <Text style={chatStyles.messageText}>{message.text}</Text>
                            </View>
                            {message.isFavorite ? (
                                <View style={{marginLeft: 8}}>
                                    <AppIcon name='star' size={16} />
                                </View>
                            ) : (
                                <></>
                            )}                
                        </View>
                    </View>
                </Pressable>
            )
        } else {
            return(<></>)
        }
    }

    return (
        <>
            {generateMessage()}
        </>        
    )
}

export default ChatMessage
