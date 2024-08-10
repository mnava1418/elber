import { StyleSheet } from "react-native"

export const globalColors = {
    primary: '#20516D',
    text: '#94B8D7'
}

export const globalStyles = StyleSheet.create({
    text: {
        color: globalColors.text,
        fontFamily: 'Roboto',
        fontSize: 20,
    },

    title: {
        fontWeight: 700,
        fontSize: 40
    }
})