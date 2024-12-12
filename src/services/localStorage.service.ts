import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocalStorageKey } from "../interfaces/app.interface";

export const loadData = async (key: LocalStorageKey) => {
    try {
        const value = await AsyncStorage.getItem(key)
        return value
    } catch (error) {
        throw new Error(`Unable to get value for key ${key}`);
    }
}

export const saveData = async (key: LocalStorageKey, value: string) => {
    try {
        await AsyncStorage.setItem(key, value)
    } catch (error) {
        throw new Error(`Unable to set data on ${key}`);
    }
}