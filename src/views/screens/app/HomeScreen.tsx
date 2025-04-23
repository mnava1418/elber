import React, { useContext, useEffect } from 'react'
import MainView from '../../components/ui/MainView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Animated, Pressable } from 'react-native'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import CustomAlert from '../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../interfaces/ui.interface'
import { openSettings } from 'react-native-permissions'
import { selectAuthenticatedUser } from '../../../store/selectors/auth.selector'
import { GlobalContext } from '../../../store/GlobalState'
import useElber from '../../../hooks/app/useElber'
import SocketModel from '../../../models/Socket.model'
import VoiceWave from '../../components/ui/VoiceWave'
import CustomText from '../../components/ui/CustomText'

const logo = require('../../../assets/images/dot.png')

const HomeScreen = () => {
    const {top} = useSafeAreaInsets()
    const {state, dispatch} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)
    
    const {
        isListening, promptRef, scaleImage, isElberProcessing,
        prompt, setPrompt,
        prepareSpeech, removeSpeechListener,
        stopListening, startListening,
        alertVisible, setAlertVisible,
        spinImage, spinAnimation
    } = useElber(state.elber)

    const handleBtnTouch = async () => {     
        if(isListening.current) {
            stopListening()                
        } else {
            setPrompt('')
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

    const spin = spinImage.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    })

    useEffect(() => {  
        SocketModel.getInstance().connect(dispatch)
        prepareSpeech()
        return () => {
            removeSpeechListener()
        }
    }, [])

    useEffect(() => {
        promptRef.current = prompt
    },[prompt])

    useEffect(() => {
        setPrompt(`Hola ${user.name}, ¿cómo te puedo ayudar?`)
    }, [user])

    useEffect(() => {
        if(isElberProcessing) {
            spinAnimation.start()
        } else {
            spinAnimation.reset()
        }
    },[isElberProcessing])

    return (
        <MainView style={{paddingTop: top}}>
            <CustomNavBar title='Elber'/>
            <View style={{flex: 1,  justifyContent: 'center', alignItems: 'center'}}>
                <Pressable onPress={handleBtnTouch}>
                    <Animated.Image 
                        source={logo} 
                        style={{height: 250, width: 250, resizeMode: 'contain', 
                            transform: [{scale: scaleImage}, {rotate: spin}]}}
                        resizeMode='contain'
                    />
                </Pressable>
                <VoiceWave />
                <CustomText style={{textAlign: 'center', fontSize: 20, marginTop: 8}}>
                    {prompt}
                </CustomText>
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
