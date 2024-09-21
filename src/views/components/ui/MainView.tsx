import React from 'react'
import { ImageBackground, View } from 'react-native'
import { CustomViewProps } from '../../../interfaces/ui.interface'
import { globalColors } from '../../../styles/mainStyles'

const backgroundImage = require('../../../assets/images/mainBackground.png')

const MainView = ({style, children, showBgImage = false}: CustomViewProps) => {
    const getMainView = () => (
        <View style={[
            {flex: 1, paddingHorizontal: 20, backgroundColor: globalColors.background},
            style
        ]}>
            {children}
        </View>
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