import React from 'react'
import { Modal, View } from 'react-native'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import CustomButton from './CustomButton'
import CustomText from './CustomText'
import Subtitle from './Subtitle'
import { AlertBtnProps } from '../../../interfaces/ui.interface'

type CustomAlertProps = {
    title: string,
    message: string,
    alertBtns: AlertBtnProps [],
    visible: boolean,
}

const CustomAlert = (props: CustomAlertProps) => {
    const {title, message, visible, alertBtns} = props

    return (
        <Modal transparent={true} visible={visible} animationType="fade">
            <View style={globalStyles.modalBackground}>
                <View style={globalStyles.alertContainer}>
                    <Subtitle style={{marginBottom: 8, textAlign: 'center', fontSize: 20}}>{title}</Subtitle>
                    <CustomText style={{marginBottom: 16, textAlign: 'center'}}>{message}</CustomText>
                    {alertBtns.map((btn, index) => (
                        <CustomButton 
                            style={{width: '100%', borderBottomWidth: index < alertBtns.length - 1 ? 1 : 0, borderColor: globalColors.primary}}     
                            key={index} 
                            type={btn.type === 'cancel' ? 'danger' : 'transparent'}
                            label={btn.label} 
                            onPress={btn.action} 
                        />  
                    ))}
                </View>
            </View>
        </Modal>
    )
}

export default CustomAlert