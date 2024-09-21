import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import React from 'react'
import { View } from 'react-native';
import { globalColors } from '../../../styles/mainStyles';
import { menuStyles } from '../../../styles/menuStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from './TabIcon';

const TabBar = ({state, navigation}: BottomTabBarProps) => {
    const {bottom} = useSafeAreaInsets()
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: globalColors.background }}>
            <View style={[menuStyles.container, {marginBottom: bottom + 8}]}>
                {state.routes.map((route, index) => {
                    let icon = ''
                    const isSelected = state.index === index;

                    switch (route.name) {
                        case 'Home':
                            icon = 'radio-button-on-outline'
                            break;
                        case 'Video':
                            icon = 'videocam'
                            break;
                        case 'Chat':
                            icon = 'chatbubbles'
                            break;
                        case 'Settings':
                            icon = 'settings-sharp'
                            break;
                        default:
                            break;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
        
                        if (!isSelected && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    }

                    return (
                        <TabIcon key={index} icon={icon} isSelected={isSelected} onPress={onPress} />
                    )
                })}
            </View>
        </View>
    )
}

export default TabBar