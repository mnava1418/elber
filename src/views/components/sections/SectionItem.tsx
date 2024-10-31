import React from 'react'
import { Pressable, View } from 'react-native'
import AppIcon from '../ui/AppIcon'
import CustomText from '../ui/CustomText'
import { sectionStyles } from '../../../styles/sectionStyles'
import { SectionItemProps } from '../../../interfaces/ui.interface'
import { NavigationProp, useNavigation } from '@react-navigation/native'

type Props = {
    item: SectionItemProps,
    current: number,
    count: number
}

const SectionItem = ({item, current, count}: Props) => {
    const {title, screenName, icon} = item
    const navigation = useNavigation<NavigationProp<any>>()
    return (
        <Pressable 
            style={({pressed}) => ({opacity: pressed ? 0.8 : 1.0})}
            onPress={() => {navigation.navigate(screenName)}}
        >
            <View style={[
                sectionStyles.item,
                {borderBottomWidth: current < count - 1 ? 1 : 0}
            ]}
            >
                <View style={{marginRight: 8}}>
                    <AppIcon name={icon} size={27} />
                </View>
                <CustomText style={{fontWeight: 600}}>{title}</CustomText>
                <View style={{position: 'absolute', right: 8}}>
                    <AppIcon name={'chevron-forward-outline'} size={30} />
                </View>
            </View>
        </Pressable>
    )
}

export default SectionItem