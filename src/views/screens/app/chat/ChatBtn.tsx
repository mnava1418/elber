import React from 'react'
import { Pressable, View } from 'react-native'
import { globalColors } from '../../../../styles/mainStyles'
import AppIcon from '../../../components/ui/AppIcon'
import { chatStyles } from '../../../../styles/chatStyles'

type ChatBtnProps = {
    type: 'primary' | 'outline',
    icon: string
    onPress: () => void
}

const ChatBtn = ({type, icon, onPress}: ChatBtnProps) => {
    let btnStyles:any = [chatStyles.btn]

    if(type === 'primary') {
        btnStyles = [...btnStyles, chatStyles.btnPrimary]
    }

    return (
        <Pressable 
            style={({pressed}) => ([
                {
                    opacity: pressed ? 0.8 : 1.0
                }
            ])}
            onPress={onPress}
        >
            <View style={btnStyles}>
                <AppIcon name={icon} color={globalColors.text} size={ type === 'primary' ? 20 : 32} />
            </View>
        </Pressable>
    )
}

export default ChatBtn