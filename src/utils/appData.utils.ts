import { ChatActionType } from "../interfaces/app.interface";
import { SectionItemProps } from "../interfaces/ui.interface";

export const settingsSections: SectionItemProps[] = [
    {
        icon: 'person',
        title: 'Perfil',
        screenName: 'SettingsAccount'
    },
    {
        icon: 'lock-closed',
        title: 'Privacidad',
        screenName: 'SettingsPrivacy'
    }
]

export const chatActions: ChatActionType[] = [
    {
        text: 'Destacar',
        icon: 'star-outline',
        type: 'favorite'
    },
    {
        text: 'Compartir',
        icon: 'share-outline',
        type: 'share'
    },
    {
        text: 'Copiar',
        icon: 'copy-outline',
        type: 'copy'
    },
    {
        text: 'Eliminar',
        icon: 'trash-outline',
        type: 'delete'
    }
]
