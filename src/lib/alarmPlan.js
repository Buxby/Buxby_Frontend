import { createReservation, predictPreparation, recommendAlarm } from '../api/alarm'
import { LEARNING } from '../data/mock'
import { addMinutes, nextArrival, toLocalDateTime } from './time'

function manualPrepMinutes(state) {
  if (state.prepMode === 'total' && state.prepTotal != null) return state.prepTotal
  return state.prep.reduce((sum, item) => sum + item.minutes, 0)
}

// 기록이 충분하면 학습값, 부족하면 사용자가 입력한 준비 시간을 쓴다 (예약 API는 1분 이상만 허용)
async function resolvePrepMinutes(state) {
  const prediction = await predictPreparation()
  const minutes = prediction.samples >= LEARNING.requiredDays ? prediction.predictedMinutes : manualPrepMinutes(state)
  return Math.min(Math.max(minutes, 1), 1440)
}

// 선택한 경로로 기상·출발 시각을 계산하고 서버에 예약을 저장한다
export async function planAlarm(state, option = state.routeDetail) {
  const preparationMinutes = await resolvePrepMinutes(state)
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
    destination: state.destination.name,
    desiredArrivalTime: toLocalDateTime(arrival),
    wakeTime: recommended.wakeTime,
    leaveHomeTime: recommended.leaveHomeTime,
    routeMinutes: option.total,
    preparationMinutes,
  })

  return {
    reservationId: reservation.id,
    wakeTime: recommended.wakeTime,
    leaveHomeTime: recommended.leaveHomeTime,
    boardingTime: recommended.busBoardingTime,
    arrivalTime: toLocalDateTime(arrival),
    preparationMinutes,
    bus: option.name,
  }
}
