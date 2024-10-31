import { PropsWithChildren } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native"

export interface CustomViewProps extends PropsWithChildren {
    showBgImage?: boolean
    style?: StyleProp<ViewStyle>
}

export interface CustomTextProps extends PropsWithChildren {
    style?: StyleProp<TextStyle>
}

export interface CustomButtonProps extends CustomViewProps {
    type: 'primary' | 'transparent' | 'danger'
    label: string
    onPress: () => void
}

export interface CustomNavBtnProps extends CustomViewProps {
    icon?: string,
    onPress?: () => void 
}

export interface CustomNavBarProps {
    leftBtn?: CustomNavBtnProps
    rightBtn?: CustomNavBtnProps
    title?: string
}

export interface SectionItemProps {
    title: string,
    screenName: string
}

export interface AlertBtnProps {
    type: 'default' | 'cancel'
    label: string,
    action: () => void
}