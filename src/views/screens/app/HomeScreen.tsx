import React, { useContext, useEffect, useState } from 'react'
import MainView from '../../components/ui/MainView'
import { selectAuthenticatedUser } from '../../../store/selectors/auth.selector'
import { GlobalContext } from '../../../store/GlobalState'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Animated, Pressable, TextInput, Platform } from 'react-native'
import usePulseImage from '../../../hooks/animations/usePulseImage'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import { checkDevicePermissions } from '../../../services/entitlements.service'

const logo = require('../../../assets/images/dot.png')

const HomeScreen = () => {
    const {state} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)
    const {top} = useSafeAreaInsets()
    const {pulseImage, scaleImage} = usePulseImage(400, 1.1)
    const [isListening, setIsListening] = useState(false)
    const [prompt, setPrompt] = useState('')

    const handleBtnTouch = () => {
        if(isListening) {
            pulseImage.reset()
            setIsListening(false)
        } else {
            pulseImage.start()
            setIsListening(true)
        }
    }

    useEffect(() => {
        setPrompt(`Hola ${user.name}, ¿cómo te puedo ayudar?`)
        checkDevicePermissions(Platform.OS === 'ios' ? 'ios' : 'android')        
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
        </MainView>
    )
}

export default HomeScreen
