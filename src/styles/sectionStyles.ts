import { StyleSheet } from "react-native";
import { globalColors } from "./mainStyles";

export const sectionStyles = StyleSheet.create({
    container: {
        backgroundColor: globalColors.primary, 
        borderRadius: 15, 
        marginVertical: 24
    },

    item: {
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
    }
})