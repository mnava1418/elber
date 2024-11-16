import React, { useContext, useEffect, useRef, useState } from 'react'
import { Dimensions, Modal, Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { globalStyles } from '../../../../styles/mainStyles'
import CustomButton from '../../../components/ui/CustomButton'
import CustomText from '../../../components/ui/CustomText'
import { GlobalContext } from '../../../../store/GlobalState'
import { selectSelectedMeasure } from '../../../../store/selectors/chat.selector'

type ChatActionsProps = {
    visible: boolean,
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatActions = (props: ChatActionsProps) => {
    const {visible, setVisible} = props
    const screenHeight = Dimensions.get('window').height
    const {state} = useContext(GlobalContext)
    const selectedMeasure = selectSelectedMeasure(state.chat)
    const actionsRef = useRef<View>(null)
    const [customStyle, setCustomStyle] = useState<StyleProp<ViewStyle>>({})

    useEffect(() => {
        if(visible && selectedMeasure && actionsRef.current) {
            actionsRef.current.measure((fx, fy, width, height) => {
                const ALERTA_HEIGHT = height + 16
                const spaceAbove = selectedMeasure.py
                const spaceBelow = screenHeight - (selectedMeasure.py + selectedMeasure.height)
                const showAbove = spaceBelow < ALERTA_HEIGHT && spaceAbove >= ALERTA_HEIGHT
                let top = showAbove ? selectedMeasure.py - ALERTA_HEIGHT : selectedMeasure.py + selectedMeasure.height
                top = top + 8
                
                if(selectedMeasure.pv === 'left') {
                    setCustomStyle({position: 'absolute', top, left: 32})
                } else {
                    setCustomStyle({position: 'absolute', top, right: 32})
                }
            })
        }
    }, [selectedMeasure])
    
    return (
        <Modal transparent={true} visible={visible} animationType="fade">
            <Pressable style={{flex: 1}} onPress={() => {setVisible(false)}}>
                <View style={globalStyles.modalBackground}>
                    <View ref={actionsRef} style={[globalStyles.alertContainer, customStyle]}>
                        <CustomText style={{marginBottom: 16, textAlign: 'center'}}>Aqui probando</CustomText>
                        <CustomButton type='transparent' label='Prueba' onPress={() => {
                            console.log('adiosin')
                            setVisible(false)
                        }} />
                    </View>
                </View>
            </Pressable>
        </Modal>
    )
}

export default ChatActions