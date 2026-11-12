import { addMinutes } from './time'

// 미루기 상한: 처음 기상 시각 + 설정한 분. 집에서 나가야 하는 시각은 넘기지 않는다.
export function snoozeLimitAt(plan, settings) {
  const wake = new Date(plan.wakeTime)
  const limit = addMinutes(wake, settings.snoozeLimitMinutes)
  const leave = new Date(plan.leaveHomeTime)
  return limit < leave ? limit : leave
}

// 이 예약에 대해 미뤄 둔 알람 정보 (다른 예약의 미루기 기록은 무시)
export function activeSnooze(state) {
  const { snooze, plan } = state
  return snooze && plan && snooze.reservationId === plan.reservationId ? snooze : null
}

// 지금 미루면 다시 울릴 시각. 상한에 도달했으면 null
export function nextSnoozeAt(plan, settings, now = new Date()) {
  const limit = snoozeLimitAt(plan, settings)
  if (now >= limit) return null
  const next = addMinutes(now, settings.snoozeMinutes)
  return next < limit ? next : limit
}
