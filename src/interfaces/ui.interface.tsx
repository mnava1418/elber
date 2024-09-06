import { PropsWithChildren } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native"

export interface CustomViewProps extends PropsWithChildren {
    style?: StyleProp<ViewStyle>
}

export interface CustomTextProps extends PropsWithChildren {
    style?: StyleProp<TextStyle>
}

export interface CustomButtonProps extends CustomViewProps {
    type: 'primary' | 'transparent'
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