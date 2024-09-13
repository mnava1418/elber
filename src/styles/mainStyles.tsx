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
        fontWeight: "600",
        fontSize: 24
    },

    btn: {
        padding: 10,
        borderRadius: 15,
        alignItems: 'center',
        alignSelf: 'center',
    },

    btnPrimary: {
        backgroundColor: globalColors.primary,
        width: '100%',
        height: 50,
    },

    btnText: {
        fontWeight: "600",
        fontSize: 20,
        color: globalColors.text
    },

    input: {
        height: 48,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: globalColors.text,
        borderRadius: 15,
        width: '100%',
        color: '#000',
        fontSize: 18
    },

    textArea: {
        height: 200,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: globalColors.text,
        borderRadius: 15,
        width: '100%',
        color: '#000',
        fontSize: 18,
        textAlignVertical: 'top',
    }
})