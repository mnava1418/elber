import { PropsWithChildren } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native"

export interface CustomViewProps extends PropsWithChildren {
    style?: StyleProp<ViewStyle>
}

export interface CustomTextProps extends PropsWithChildren {
    style?: StyleProp<TextStyle>
}