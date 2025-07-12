import { Platform } from "react-native"
import { checkCamaraPermissions, checkPhotoLibraryPermissions } from "./entitlements.service"
import * as elberActions from '../store/actions/elber.actions'
import { launchCamera } from "react-native-image-picker"
import {CameraRoll} from '@react-native-camera-roll/camera-roll'

export const openCamera = async(dispatch: (value: any) => void) => {    
    dispatch(elberActions.setElberIsProcessing(false))

    const hasCameraPermissions = await checkCamaraPermissions(Platform.OS === 'ios' ? 'ios' : 'android')
            .catch(() => false)
    
    if (hasCameraPermissions) {
        launchCamera({
            mediaType: 'photo',
            saveToPhotos: false,
            cameraType: 'back',
            presentationStyle: 'fullScreen'

        }, (response) => {
            if (response.didCancel) {
                return
            } else if (response.errorCode) {
                console.error('Camera Code:', response.errorCode, response.errorMessage)                
            } else {
                const photoUri = response.assets?.[0]?.uri
                if (photoUri) {
                    savePhoto(photoUri, dispatch)
                }
            }
        })
    } else {
        dispatch(elberActions.setEntitlementsAlert({
            isVisible: true,
            title: 'Cámara',
            text: 'Elber necesita acceso a tu cámara para saber que estás viendo. Ve a Configuración y habilítalo.'
        }))
    }
}

export const savePhoto = async (uri: string, dispatch: (value: any) => void) => {
    const hasPhotoLibraryPermission = await checkPhotoLibraryPermissions(Platform.OS === 'ios' ? 'ios' : 'android')

    if (hasPhotoLibraryPermission) {
        try {
            await CameraRoll.saveAsset(uri, {
                type: 'photo',
                album: 'Elber'
            })
        } catch (error) {
            console.error('Error saving photo in album:', error)
        }
    } else {
        dispatch(elberActions.setEntitlementsAlert({
            isVisible: true,
            title: 'Fotos',
            text: 'Elber necesita acceso a tus fotos para que pueda analizar imágenes. Ve a Configuración y habilítalo.'
        }))
    }
}
