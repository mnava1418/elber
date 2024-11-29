import React, { useContext, useEffect, useRef, useState } from 'react'
import MainView from '../../components/ui/MainView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Animated, Pressable, TextInput, Platform } from 'react-native'
import usePulseImage from '../../../hooks/animations/usePulseImage'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import { checkVoicePermissions } from '../../../services/entitlements.service'
import CustomAlert from '../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../interfaces/ui.interface'
import { openSettings } from 'react-native-permissions'
import Voice from '@react-native-voice/voice'
import { selectAuthenticatedUser } from '../../../store/selectors/auth.selector'
import { GlobalContext } from '../../../store/GlobalState'

const logo = require('../../../assets/images/dot.png')

const HomeScreen = () => {
    const {top} = useSafeAreaInsets()
    const {pulseImage, scaleImage} = usePulseImage(400, 1.1)
    const {state} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)
    const [prompt, setPrompt] = useState('')
    const [alertVisible, setAlertVisible] = useState(false)
    const silenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListening = useRef(false)
    const promptRef = useRef('')

    const handleBtnTouch = async () => {     
        if(isListening.current) {
            stopListening()                
        } else {
            startListening()
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
        Voice.onSpeechStart = () => {
            isListening.current = true
            resetSilenceTimeout()
        }

        Voice.onSpeechEnd = () => {
            isListening.current = false
            sendMessage()
        }

        Voice.onSpeechResults = (event) => {
            if(event.value) {
                setPrompt(event.value[0])
                promptRef.current = event.value[0]
            }
        }

        Voice.onSpeechPartialResults = () => {
            if(isListening.current) {
                resetSilenceTimeout()
            }
        }

        Voice.onSpeechError = (error) => {            
            console.log('No te escuché! ¿Me lo repites, porfa?')
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners)
        }
    }, [])

    useEffect(() => {
        promptRef.current = prompt
    },[prompt])

    useEffect(() => {
        setPrompt(`Hola ${user.name}, ¿cómo te puedo ayudar?`)
    }, [user])

    const startListening = async () => {
        const hasVoicePermissions = await checkVoicePermissions(Platform.OS === 'ios' ? 'ios' : 'android')
        .catch(() => false)

        if(hasVoicePermissions) {
            try {
                setPrompt('')
                pulseImage.start()
                await Voice.start('es-MX')
            } catch (error) {
                console.log('Error al escuchar', error)
            }
        } else {
            setAlertVisible(true)
        }
    }

    const stopListening = async() => {
        try {
            pulseImage.reset()
            isListening.current = false
            clearSilenceTimeout()
            await Voice.stop()            
        } catch (error) {
            console.log('Error al detener la escucha', error)
        }
    }

    const resetSilenceTimeout = () => {
        if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current)
        }

        silenceTimeout.current = setTimeout(() => {
            if (isListening.current) {                
                stopListening()
            }
        }, 2000)
    };

    const clearSilenceTimeout = () => {
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current)
          silenceTimeout.current = null
        }
    };

    const sendMessage = () => {
        console.log('Vamos a mandar: ', promptRef.current)
    }
    
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
                            height: 150, 
                            backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                            color: globalColors.text,
                        }
                    ]}
                    value={prompt}
                    onChangeText={setPrompt}
                    keyboardType='default'
                    autoCapitalize='none'
                    multiline={true}
                    numberOfLines={30}
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
