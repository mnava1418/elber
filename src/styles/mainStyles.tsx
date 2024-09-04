import { StyleSheet } from "react-native"

export const globalColors = {
    primary: '#20516D',
    text: '#94B8D7'
}

export const globalStyles = StyleSheet.create({
    text: {
        color: globalColors.text,
        fontFamily: 'Roboto',
        fontSize: 18,
    },

    title: {
        fontWeight: 700,
        fontSize: 32
    },

    subtitle: {
        fontSize: 24
    },

    btn: {
        padding: 10,
        borderRadius: 50,
        alignItems: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },

    btnPrimary: {
        backgroundColor: globalColors.primary,
        width: '80%',
        height: 50,
    },

    btnText: {
        fontWeight: "bold",
        fontSize: 20,
        color: globalColors.text
    }
})