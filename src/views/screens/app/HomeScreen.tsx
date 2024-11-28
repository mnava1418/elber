import React, { useContext, useEffect, useState } from 'react'
import MainView from '../../components/ui/MainView'
import { selectAuthenticatedUser } from '../../../store/selectors/auth.selector'
import { GlobalContext } from '../../../store/GlobalState'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Animated, Pressable, TextInput, Platform } from 'react-native'
import usePulseImage from '../../../hooks/animations/usePulseImage'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import { checkVoicePermissions } from '../../../services/entitlements.service'
import CustomAlert from '../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../interfaces/ui.interface'
import { openSettings } from 'react-native-permissions'

const logo = require('../../../assets/images/dot.png')

const HomeScreen = () => {
    const {state} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)
    const {top} = useSafeAreaInsets()
    const {pulseImage, scaleImage} = usePulseImage(400, 1.1)
    const [isListening, setIsListening] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [alertVisible, setAlertVisible] = useState(false)

    const handleBtnTouch = async () => {
        const hasVoicePermissions = await checkVoicePermissions(Platform.OS === 'ios' ? 'ios' : 'android')
        .catch(() => false)

        if(hasVoicePermissions) {
            if(isListening) {
                pulseImage.reset()
                
            } else {
                pulseImage.start()
            }
    
            setIsListening(!isListening)
        } else {
            setAlertVisible(true)
        }
    }

    const alertBtns: AlertBtnProps[] = [
        {
            label: 'Ok',
            type: 'default',
            action: () => {
                openSettings('application')
                setAlertVisible(false)
            }
        },
        {
            label: 'Cancelar',
            type: 'cancel',
            action: () => {
                setAlertVisible(false)
            }
        }
    ]
        
    useEffect(() => {
        setPrompt(`Hola ${user.name}, ¿cómo te puedo ayudar?`)        
    }, [user])
    
    return (
        <MainView style={{paddingTop: top}}>
            <CustomNavBar title='Elber'/>
            <View style={{flex: 1,  justifyContent: 'center', alignItems: 'center'}}>
                <Pressable onPress={handleBtnTouch}>
                    <Animated.Image 
                        source={logo} 
                        style={{height: 250, width: 250, resizeMode: 'contain', transform: [{scale: scaleImage}]}}
                        resizeMode='contain'
                    />
                </Pressable>
                <TextInput
                    style={[
                        globalStyles.textArea, 
                        {
                            marginTop: 40,
                            height: 100, 
                            backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                            color: globalColors.text,
                        }
                    ]}
                    value={prompt}
                    onChangeText={setPrompt}
                    keyboardType='default'
                    autoCapitalize='none'
                    multiline={true}
                    numberOfLines={15}
                    textAlignVertical="top"
                    editable = {false}
                />
            </View>
            <CustomAlert 
                visible={alertVisible}
                title='Activa el Micrófono'
                message='Elber necesita acceso al micrófono y al reconocimiento de voz para interactuar contigo. Ve a Configuración y habilítalos'
                alertBtns={alertBtns}

            />
        </MainView>
    )
}

export default HomeScreen
