import DevicePermissions from "./devicePermissions.adapter";
import { check, PERMISSIONS, request, RESULTS } from "react-native-permissions";

class AndroidPermissions implements DevicePermissions {
    async checkMic(): Promise<boolean> {
        try {
            const result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
            
            if (result === RESULTS.GRANTED) {
                return true
            } else if (result === RESULTS.DENIED) {
                const requestResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
                if (requestResult === RESULTS.GRANTED) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        } catch (error) {
            console.error(error)
            return false
        }
    }
}

export default AndroidPermissions