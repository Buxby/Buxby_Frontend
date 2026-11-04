import { createContext, useContext } from 'react'

export const AppStateContext = createContext(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState는 AppStateProvider 안에서 사용해야 합니다.')
  return ctx
}

export const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export function formatArrival(arrival, days) {
  if (!arrival) return ''
  const minute = String(arrival.minute).padStart(2, '0')
  const base = `${arrival.ampm} ${arrival.hour}:${minute}`
  if (!days || days.length === 0) return base
  const weekdays = ['월', '화', '수', '목', '금']
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return `${base} · 월~금`
  if (days.length === 7) return `${base} · 매일`
  return `${base} · ${DAYS.filter((d) => days.includes(d)).join('·')}`
}
