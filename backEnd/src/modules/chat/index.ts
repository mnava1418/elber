import type { Server } from 'socket.io'
import env from '../../config/env.js'
import { journalDay } from '../../shared/dates/journal-day.js'
import { DIARY_SYSTEM_PROMPT } from './infrastructure/diary-system-prompt.js'
import { ELBER_SYSTEM_PROMPT } from './infrastructure/elber-system-prompt.js'
import createSection, { type Section } from './section.js'
import createBugsSkill from './skills/bugs/index.js'
import createJournalSkill from './skills/journal/index.js'
import createMemorySkills from './skills/memory/index.js'
import createWeatherSkill from './skills/weather/index.js'

// Public entry point of the chat module: only app.ts imports it. The chat
// decides its own sections and which skills each one gets: they are plugins
// of the chat, not modules, so the rest of the app never sees them.
export interface ChatModule {
    chat: Section
    diary: Section
}

interface ChatModuleDeps {
    io: Server
}

const createChatModule = ({io}: ChatModuleDeps): ChatModule => {
    const memory = createMemorySkills()

    const chat = createSection({io, section: {
        namespace: '/chat',
        collection: 'conversations',
        systemPrompt: ELBER_SYSTEM_PROMPT,
        skills: [createWeatherSkill(), memory.skill, createBugsSkill()],
        webTools: true,
    }})

    // The diary only has its own tools and the profile: the chat can't reach
    // its conversations, and it can't reach the chat's notes or the web.
    const diary = createSection({io, section: {
        namespace: '/diary',
        collection: 'diary',
        systemPrompt: DIARY_SYSTEM_PROMPT,
        skills: [createJournalSkill(), memory.profile],
        webTools: false,
        canUse: (uid) => uid === env.MEMORY_OWNER_UID,
        daily: (now) => {
            const {date, title} = journalDay(now)
            return {id: date, title: title.charAt(0).toUpperCase() + title.slice(1)}
        },
    }})

    return {chat, diary}
}

export default createChatModule
