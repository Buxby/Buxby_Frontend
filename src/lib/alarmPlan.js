import { getMe } from '../api/auth'
import { createReservation, predictPreparation, recommendAlarm } from '../api/alarm'
import { LEARNING } from '../data/mock'
import { addMinutes, nextArrival, toLocalDateTime } from './time'

const GUEST_KEY = 'buxby-guest-id'
const SKIP_LOGIN = import.meta.env.DEV && import.meta.env.VITE_SKIP_LOGIN === 'true'

function guestId() {
  let id = window.localStorage.getItem(GUEST_KEY)
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(GUEST_KEY, id)
  }
  return id
}

// 백엔드 알람·준비 시간 API가 요구하는 사용자 ID
export async function getUserId() {
  const me = await getMe()
  if (me?.id != null) return String(me.id)
  if (SKIP_LOGIN) return guestId()
  throw new Error('로그인이 필요해요.')
}

function manualPrepMinutes(state) {
  if (state.prepMode === 'total' && state.prepTotal != null) return state.prepTotal
  return state.prep.reduce((sum, item) => sum + item.minutes, 0)
}

// 기록이 충분하면 학습값, 부족하면 사용자가 입력한 준비 시간을 쓴다 (예약 API는 1분 이상만 허용)
async function resolvePrepMinutes(userId, state) {
  const prediction = await predictPreparation(userId)
  const minutes = prediction.samples >= LEARNING.requiredDays ? prediction.predictedMinutes : manualPrepMinutes(state)
  return Math.min(Math.max(minutes, 1), 1440)
}

// 선택한 경로로 기상·출발 시각을 계산하고 서버에 예약을 저장한다
export async function planAlarm(state, option = state.routeDetail) {
  const userId = await getUserId()
  const preparationMinutes = await resolvePrepMinutes(userId, state)
  const bufferMinutes = state.settings.bufferMinutes
  const arrival = nextArrival(state.arrival, state.days, option.total + bufferMinutes + preparationMinutes + 1)
  const boarding = addMinutes(arrival, -(option.total - option.walkToStop))

  const recommended = await recommendAlarm({
    busBoardingTime: toLocalDateTime(boarding),
    predictedPreparationMinutes: preparationMinutes,
    walkingMinutes: option.walkToStop,
    bufferMinutes,
  })
  const reservation = await createReservation({
    userId,
    destination: state.destination.name,
    desiredArrivalTime: toLocalDateTime(arrival),
    wakeTime: recommended.wakeTime,
    leaveHomeTime: recommended.leaveHomeTime,
    routeMinutes: option.total,
    preparationMinutes,
  })

  return {
    reservationId: reservation.id,
    userId,
    wakeTime: recommended.wakeTime,
    leaveHomeTime: recommended.leaveHomeTime,
    boardingTime: recommended.busBoardingTime,
    arrivalTime: toLocalDateTime(arrival),
    preparationMinutes,
    bus: option.name,
  }
}
