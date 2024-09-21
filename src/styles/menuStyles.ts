import { StyleSheet } from "react-native";

export const menuStyles  = StyleSheet.create({
    container: {
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignSelf: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
        borderRadius: 50, 
    },

    icon: {
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 50, 
        width: 56, 
        height: 56, 
        margin: 8
    }
})