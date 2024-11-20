import { StyleSheet } from "react-native";

export const navBarStyles = StyleSheet.create({
    main: {
        flexDirection: 'row', 
        position: 'absolute', 
        left: 0, 
        right: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 48
    },

    btn: {
        minWidth: 40, 
        minHeight: 40, 
        zIndex: 100
    },

    btnList: {
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
    },

    title: {
        flex: 1, 
        position: 'absolute', 
        left: 0, 
        right: 0
    },

    titleTxt: {
        textAlign: 'center', 
        fontSize: 20
    }
});
  