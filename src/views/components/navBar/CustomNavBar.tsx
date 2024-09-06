import React from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomNavBarProps } from '../../../interfaces/ui.interface'
import CustomNavBtn from './CustomNavBtn'
import Title from '../ui/Title'

const CustomNavBar = (props: CustomNavBarProps) => {
    const {top} = useSafeAreaInsets()
    const {leftBtn = undefined} = props
    const {rightBtn = undefined} = props

    return (
        <View 
            style={{
                paddingTop: top, 
                flexDirection: 'row', 
                position: 'absolute', 
                left: 0, 
                right: 0,
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            {leftBtn ? (
                <CustomNavBtn icon={leftBtn.icon} onPress={leftBtn.onPress} style={leftBtn.style} />
            ) : (
                <View style={{width: 40, height: 40}} />
            )}
            <View style={{flex: 1}}><Title style={{textAlign: 'center', fontSize: 24}}>{props.title}</Title></View>
            {rightBtn ? (
                <CustomNavBtn icon={rightBtn.icon} onPress={rightBtn.onPress} style={rightBtn.style} />
            ) : (
                <View style={{width: 40, height: 40}} />
            )}
        </View>
    )
}

export default CustomNavBar
