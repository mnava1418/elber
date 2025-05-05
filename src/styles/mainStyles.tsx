import { StyleSheet } from "react-native"

export const globalColors = {
    primary: '#20516D',
    text: '#94B8D7',
    background: '#012E46',
    alert: '#FF4C4C'
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
    },

    input: {
        height: 48,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: globalColors.text,
        borderRadius: 15,
        color: '#000',
        fontSize: 18
    },

    textArea: {
        height: 200,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: globalColors.text,
        borderRadius: 15,
        width: '100%',
        color: '#000',
        fontSize: 18,
        textAlignVertical: 'top',
    },

    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    alertContainer: {
        width: 300,
        padding: 20,
        backgroundColor: globalColors.background,
        borderRadius: 15,
        alignItems: 'center',
    },

    voiceItem: {
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderBottomColor: globalColors.background,
        borderBottomWidth: 1
    },

    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 100,      
    },

    bar: {
        width: 10,
        height: 40,
        borderRadius: 15,
    }
})