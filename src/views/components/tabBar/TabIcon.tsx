import React from 'react'
import { Pressable, View } from 'react-native'
import { globalColors } from '../../../styles/mainStyles'
import { menuStyles } from '../../../styles/menuStyles'
import AppIcon from '../ui/AppIcon'

type TabIconProps = {
    icon: string,
    onPress: () => void
    isSelected?: boolean
}

const TabIcon = ({icon, onPress, isSelected = false}: TabIconProps) => {
    return (
        <Pressable 
            style={({pressed}) => ([
                {
                    opacity: pressed ? 0.8 : 1.0
                }
            ])}
            onPress={onPress}
        >
            <View style={[menuStyles.icon, {backgroundColor: isSelected ? globalColors.primary : 'transparent'}]}>
                <AppIcon name={icon} size={34} color={isSelected ? globalColors.text : globalColors.primary}/>
            </View>
        </Pressable>
    )
}

export default TabIcon
