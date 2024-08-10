import React, { PropsWithChildren } from 'react'
import { ImageBackground, StyleProp, View, ViewStyle } from 'react-native'

const backgroundImage = require('../../../assets/images/mainBackground.png')

interface MainViewProps extends PropsWithChildren {
    style?: StyleProp<ViewStyle> 
}

const MainView = ({style, children}: MainViewProps) => {
    return (
        <ImageBackground source={backgroundImage} style={{flex: 1}} blurRadius={50}>
            <View style={[
                {flex: 1},
                style
            ]}>
                {children}
            </View>
        </ImageBackground>
    )
}

export default MainView