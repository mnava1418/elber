import React, { useContext, useEffect, useRef } from 'react'
import { View, Text, Pressable } from 'react-native'
import { chatStyles } from '../../../../styles/chatStyles'
import { ChatMessageType } from '../../../../interfaces/app.interface'
import { GlobalContext } from '../../../../store/GlobalState'
import { setSelectedMeasure, setShowFavorites } from '../../../../store/actions/chat.actions'
import AppIcon from '../../../components/ui/AppIcon'
import { selectShowFavorites } from '../../../../store/selectors/chat.selector'
import useAnimateText from '../../../../hooks/animations/useAnimateText'

type ChatMessageProps = {
    index: number
    message: ChatMessageType
    isNewMessage: boolean    
    showActions: React.Dispatch<React.SetStateAction<boolean>>
    scrollToMessage: (index: number) => void
}

const ChatMessage = ({index, message, isNewMessage, showActions, scrollToMessage}: ChatMessageProps) => {
    const messageRef = useRef<View>(null)
    const {state, dispatch} = useContext(GlobalContext)
    const showFavorites = selectShowFavorites(state.chat)
    const {animatedText, animateText} = useAnimateText()

    useEffect(() => {
        if(message.text) {
            animateText(message.text, 20)
        }
    }, [])    

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

    const getMessageText = () => {
        if(index === 0 && message.sender === 'bot' && isNewMessage) {            
            return (
                <Text style={chatStyles.messageText}>{animatedText}</Text>
            )
        } else {
            return(
                <Text style={chatStyles.messageText}>{message.text}</Text>
            )
        }
    }

    const generateMessage = () => {
        if(message.text && ((showFavorites && message.isFavorite) || !showFavorites)) {
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
                                {getMessageText()}
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
