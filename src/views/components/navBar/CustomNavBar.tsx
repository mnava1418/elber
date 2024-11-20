import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomNavBarProps } from '../../../interfaces/ui.interface'
import CustomNavBtn from './CustomNavBtn'
import Title from '../ui/Title'
import { navBarStyles } from '../../../styles/navBarStyles'

const CustomNavBar = (props: CustomNavBarProps) => {
    const {top} = useSafeAreaInsets()
    const {leftBtn = undefined} = props
    const {rightBtns = []} = props

    return (
        <View 
            style={[navBarStyles.main,{marginTop: top}]}
        >
            <View style={navBarStyles.btn}>
                {leftBtn ? (
                    <CustomNavBtn icon={leftBtn.icon} onPress={leftBtn.onPress} style={leftBtn.style} />
                ) : (<></>)}
            </View>
            <View style={navBarStyles.title}><Title style={navBarStyles.titleTxt}>{props.title}</Title></View>
            <View style={[navBarStyles.btn, navBarStyles.btnList]}>
                {rightBtns.map((btn, index) => (
                    <CustomNavBtn key={index} icon={btn.icon} onPress={btn.onPress} style={btn.style} />
                ))}
            </View>
        </View>
    )
}

export default CustomNavBar
