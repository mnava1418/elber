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
        text: 'Eliminar',
        icon: 'trash-outline',
        type: 'delete-message'
    }
]