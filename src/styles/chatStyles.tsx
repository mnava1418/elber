import { StyleSheet } from "react-native";
import { globalColors } from "./mainStyles";

export const chatStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messageContainer: {
        margin: 10,
        padding: 14,
        borderRadius: 15,
        maxWidth: '80%'
    },
    userMessage: {
        marginRight: 16,
        backgroundColor: globalColors.primary,
        alignSelf: 'flex-end',
    },
    botMessage: {
        backgroundColor: globalColors.background,
        alignSelf: 'flex-start',
    },
    messageText: {
        color: globalColors.text,
        fontSize: 18
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 50, 
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginTop: 16
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        minHeight: 40,
        maxHeight: 100,
        fontSize: 18,
        color: globalColors.text
    },

    btn: {
        justifyContent: 'center', 
        alignItems: 'center', 
        width: 40, 
        height: 40,
        marginHorizontal: 8, 
    },

    btnPrimary: {
        backgroundColor: globalColors.primary,
        borderRadius: 50
    },  

    chatAction: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%'
    }
  });
  