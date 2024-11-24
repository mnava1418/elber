import React, { useContext, useEffect, useState } from 'react'
import { Dimensions, Modal, Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { globalStyles } from '../../../../styles/mainStyles'
import { GlobalContext } from '../../../../store/GlobalState'
import { selectSelectedMeasure } from '../../../../store/selectors/chat.selector'
import {chatActions} from '../../../../utils/appData.utils'
import ChatActionItem from './ChatActionItem'

type ChatActionsProps = {
    visible: boolean,
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatActions = (props: ChatActionsProps) => {
    const {visible, setVisible} = props
    const screenHeight = Dimensions.get('window').height
    const {state} = useContext(GlobalContext)
    const selectedMessage = selectSelectedMeasure(state.chat)    
    const [customStyle, setCustomStyle] = useState<StyleProp<ViewStyle>>({})

    useEffect(() => {
        if(visible && selectedMessage) {            
            const ALERTA_HEIGHT = 216
            const messageLayout = selectedMessage.layout
            const spaceAbove = messageLayout.py
            const spaceBelow = screenHeight - (messageLayout.py + messageLayout.height)
            const showAbove = spaceBelow < ALERTA_HEIGHT && spaceAbove >= ALERTA_HEIGHT
            let top = showAbove ? messageLayout.py - ALERTA_HEIGHT : messageLayout.py + messageLayout.height
            top = top + 8
            
            if(messageLayout.pv === 'left') {
                setCustomStyle({position: 'absolute', top, left: 32})
            } else {
                setCustomStyle({position: 'absolute', top, right: 32})
            }            
        }
    }, [selectedMessage])
    
    return (
        <>
            {selectedMessage ? (
                <Modal transparent={true} visible={visible} animationType="fade">
                    <Pressable style={{flex: 1}} onPress={() => {setVisible(false)}}>
                        <View style={globalStyles.modalBackground}>
                            <View style={[globalStyles.alertContainer, customStyle, {width: 250, height: 200}]}>
                                {chatActions.map((action, index) => (
                                    <ChatActionItem key={index} message={selectedMessage.content} action={action} isLast={index === chatActions.length - 1} setVisible={setVisible} />
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </Modal>
            ) 
            : (<></>)}
        </>
    )
}

export default ChatActions