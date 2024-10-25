import React from 'react'
import { View } from 'react-native'
import { sectionStyles } from '../../../styles/sectionStyles'
import SectionItem from './SectionItem'
import { SectionItemProps } from '../../../interfaces/ui.interface'

type SectionContainerProps = {
    sectionItems: SectionItemProps[]
}

const SectionContainer = ({sectionItems}: SectionContainerProps) => {
    return (
        <View style={sectionStyles.container}>
            {sectionItems.map((item, index) => (
                <SectionItem key={index} item={{title: item.title, screenName: item.screenName}} />    
            ))}
        </View>
    )
}

export default SectionContainer