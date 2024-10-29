import React from 'react'
import { ImageBackground, View } from 'react-native'
import { CustomViewProps } from '../../../interfaces/ui.interface'
import { LinearGradient } from 'react-native-linear-gradient'

const backgroundImage = require('../../../assets/images/mainBackground.png')

const MainView = ({style, children, showBgImage = false}: CustomViewProps) => {
    const getMainView = () => (
        <LinearGradient
            colors={['#000000', '#012E46']}
            style={{flex: 1}}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.60, y: 0.9 }}
        >
            <View style={[
                {flex: 1, paddingHorizontal: 20},
                style
            ]}>
                {children}
            </View>
        </LinearGradient>
    )

    const getMainViewWithImg = () => (
        <ImageBackground source={backgroundImage} style={{flex: 1}} blurRadius={50}>
            <View style={[
                {flex: 1, paddingHorizontal: 20},
                style
            ]}>
                {children}
            </View>
        </ImageBackground>
    )

    return (
        <>
            {showBgImage ? getMainViewWithImg() : getMainView()}
        </>
    )
}

export default MainView