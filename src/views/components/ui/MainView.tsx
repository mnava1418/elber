import React from 'react'
import { ImageBackground, View } from 'react-native'
import { CustomViewProps } from '../../../interfaces/ui.interface'

const backgroundImage = require('../../../assets/images/mainBackground.png')

const MainView = ({style, children}: CustomViewProps) => {
    return (
        <ImageBackground source={backgroundImage} style={{flex: 1}} blurRadius={50}>
            <View style={[
                {flex: 1, paddingHorizontal: 20},
                style
            ]}>
                {children}
            </View>
        </ImageBackground>
    )
}

export default MainView