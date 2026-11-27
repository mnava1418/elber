import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAT, DIARY } from '../chat/section'
import { getToday, listConversations, type ConversationSummary } from '../chat/history'
import { ApiError, NetworkError } from '../lib/api'
import { getSummary } from '../training/api'
import { addDays, localToday } from '../training/dates'

// Copy of web/src/inicio/useInicio.ts, plus reloading (pull to refresh, and
// coming back to Inicio): a phone keeps the screen alive instead of
// loading it again on every visit, as the web does.

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
export function errorText(error: unknown) {
  if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') return 'Demasiadas peticiones seguidas. Espera unos minutos.'
  if (error instanceof NetworkError) return 'No pudimos conectar con Elber.'
  // The cause stays in the logs, for whoever debugs it (a warning: an error
  // would cover the screen in development).
  console.warn(error)
  return 'No pudimos cargar esto.'
}

async function loadChat(): Promise<ChatCardData> {
  const page = await listConversations(CHAT.api, undefined, RECENT_CHATS)
  return { recent: page.conversations }
}

// A diary conversation's id is its day (YYYY-MM-DD). The page is ordered by
// last update, so an old day talked about again could push a recent one
// out; with one conversation per day that is rare and only dims a bar.
export function diaryWeek(todayId: string, conversationIds: string[]): DiaryCardData {
  const talked = new Set(conversationIds)
  const week = Array.from({ length: DIARY_DAYS }, (_, i) => {
    const date = addDays(todayId, i - (DIARY_DAYS - 1))
    return { date, talked: talked.has(date) }
  })
  return { todayId, talkedToday: talked.has(todayId), week }
}

async function loadDiary(): Promise<DiaryCardData> {
  const [today, page] = await Promise.all([getToday(DIARY.api), listConversations(DIARY.api, undefined, DIARY_DAYS)])
  return diaryWeek(
    today.id,
    page.conversations.map((c) => c.id),
  )
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

// Inicio's three cards: three loads in parallel (four requests).
export function useInicio() {
  const [chat, setChat] = useState<CardState<ChatCardData>>({ status: 'loading' })
  const [diary, setDiary] = useState<CardState<DiaryCardData>>({ status: 'loading' })
  const [training, setTraining] = useState<CardState<TrainingCardData>>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  // Each load gets a number: answers of an older one are dropped.
  const generation = useRef(0)
  const mounted = useRef(true)

  // A reload keeps showing what's there until the answers arrive (no skeletons).
  const load = useCallback(() => {
    const current = ++generation.current
    // The user's today, from their device, like the training page. Read on
    // every load: the app can stay open past midnight.
    const today = localToday()

    const settle = <T>(promise: Promise<T>, set: (state: CardState<T>) => void) =>
      promise.then(
        (data) => {
          if (mounted.current && current === generation.current) set({ status: 'ready', data })
        },
        (error) => {
          if (!mounted.current || current !== generation.current) return
          if (error instanceof ApiError && error.status === 403) set({ status: 'unavailable' })
          else set({ status: 'error', message: errorText(error) })
        },
      )

    return Promise.all([settle(loadChat(), setChat), settle(loadDiary(), setDiary), settle(loadTraining(today), setTraining)])
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    return () => {
      mounted.current = false
    }
  }, [load])

  // Pull to refresh: the spinner stays until every card has answered.
  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    if (mounted.current) setRefreshing(false)
  }, [load])

  const reload = useCallback(() => void load(), [load])

  return { chat, diary, training, refreshing, refresh, reload }
}
