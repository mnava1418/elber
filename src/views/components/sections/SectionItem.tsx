import React from 'react'
import { Pressable, View } from 'react-native'
import AppIcon from '../ui/AppIcon'
import CustomText from '../ui/CustomText'
import { sectionStyles } from '../../../styles/sectionStyles'
import { SectionItemProps } from '../../../interfaces/ui.interface'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { globalColors } from '../../../styles/mainStyles'

type Props = {
    item: SectionItemProps,
    current: number,
    count: number
}

const SectionItem = ({item, current, count}: Props) => {
    const {title, screenName} = item
    const navigation = useNavigation<NavigationProp<any>>()
    const viewStyles: Array<any> = [sectionStyles.item]

    if (current < count - 1) {
        viewStyles.push({borderBottomWidth: 1, borderBottomColor: globalColors.background})
    }

    return (
        <Pressable 
            style={({pressed}) => ({opacity: pressed ? 0.8 : 1.0})}
            onPress={() => {navigation.navigate(screenName)}}
        >
            <View style={viewStyles}>
                <CustomText style={{fontWeight: 600}}>{title}</CustomText>
                <View style={{position: 'absolute', right: 8}}>
                    <AppIcon name={'chevron-forward-outline'} size={30} />
                </View>
            </View>
        </Pressable>
    )
}

export default SectionItem