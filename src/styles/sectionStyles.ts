import { StyleSheet } from "react-native";
import { globalColors } from "./mainStyles";

export const sectionStyles = StyleSheet.create({
    container: {
        backgroundColor: globalColors.primary, 
        borderRadius: 15, 
    },

    item: {
        flexDirection: 'row', 
        justifyContent: 'flex-start',
        alignItems: 'center', 
        padding: 16, 
        borderBottomColor: globalColors.background
    }
})