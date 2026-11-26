import { useEffect, useState } from 'react'
import { CHAT, DIARY } from '../chat/section'
import { getToday, listConversations, type ConversationSummary } from '../chat/history'
import { ApiError } from '../lib/api'
import { getSummary } from '../training/api'
import { addDays, localToday } from '../training/plan'

// Each card loads on its own, so a section that fails doesn't hide the
// others. `unavailable`: the section isn't for this user (the diary is the
// vault owner's only), so its card isn't shown.
export type CardState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }
  | { status: 'unavailable' }

export interface ChatCardData {
  // The most recent first; empty for a new user.
  recent: ConversationSummary[]
}

export interface DiaryCardData {
  // Today's conversation as the backend decides it (the day changes at 4:00).
  todayId: string
  // There is a conversation for today. It doesn't say whether its entry was
  // saved: that lives in the vault, which the API doesn't expose.
  talkedToday: boolean
  // The last 7 days, oldest first, ending today.
  week: { date: string; talked: boolean }[]
}

export interface TrainingCardData {
  planName: string | null
  // What the rotation suggests next; null without an active plan.
  nextRoutine: string | null
  // The routine marked today, if the day is already marked.
  trainedToday: { routineName: string | null } | null
  streakWeeks: number
  thisWeek: { done: number; target: number }
}

const RECENT_CHATS = 3
const DIARY_DAYS = 7

// What the user reads when a card fails to load.
function errorText(error: unknown) {
  if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') return 'Demasiadas peticiones seguidas. Espera unos minutos.'
  if (error instanceof TypeError) return 'No pudimos conectar con Elber.'
  // The cause stays in the console, for whoever debugs it.
  console.error(error)
  return 'No pudimos cargar esto.'
}

async function loadChat(): Promise<ChatCardData> {
  const page = await listConversations(CHAT.api, undefined, RECENT_CHATS)
  return { recent: page.conversations }
}

async function loadDiary(): Promise<DiaryCardData> {
  const [today, page] = await Promise.all([getToday(DIARY.api), listConversations(DIARY.api, undefined, DIARY_DAYS)])
  // A diary conversation's id is its day (YYYY-MM-DD). The page is ordered by
  // last update, so an old day talked about again could push a recent one
  // out; with one conversation per day that is rare and only dims a dot.
  const talked = new Set(page.conversations.map((c) => c.id))
  const week = Array.from({ length: DIARY_DAYS }, (_, i) => {
    const date = addDays(today.id, i - (DIARY_DAYS - 1))
    return { date, talked: talked.has(date) }
  })
  return { todayId: today.id, talkedToday: talked.has(today.id), week }
}

async function loadTraining(today: string): Promise<TrainingCardData> {
  const summary = await getSummary(today)
  return {
    planName: summary.activePlan?.name ?? null,
    nextRoutine: summary.nextRoutine?.name ?? null,
    trainedToday: summary.todaySession ? { routineName: summary.todaySession.routineName } : null,
    streakWeeks: summary.streak.weeks,
    thisWeek: { done: summary.streak.currentWeek.done, target: summary.streak.currentWeek.target },
  }
}

// The dashboard's three cards: three requests in parallel, once per visit.
export function useInicio() {
  // The user's today, from their device, like the training page.
  const [today] = useState(localToday)
  const [chat, setChat] = useState<CardState<ChatCardData>>({ status: 'loading' })
  const [diary, setDiary] = useState<CardState<DiaryCardData>>({ status: 'loading' })
  const [training, setTraining] = useState<CardState<TrainingCardData>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const settle = <T,>(promise: Promise<T>, set: (state: CardState<T>) => void) => {
      promise.then(
        (data) => { if (!cancelled) set({ status: 'ready', data }) },
        (error) => {
          if (cancelled) return
          if (error instanceof ApiError && error.status === 403) set({ status: 'unavailable' })
          else set({ status: 'error', message: errorText(error) })
        },
      )
    }
    settle(loadChat(), setChat)
    settle(loadDiary(), setDiary)
    settle(loadTraining(today), setTraining)
    return () => { cancelled = true }
  }, [today])

  return { today, chat, diary, training }
}
