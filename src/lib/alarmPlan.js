import { ackAlarmSync, createReservation, predictPreparation, recommendAlarm } from '../api/alarm'
import { LEARNING } from '../data/mock'
import { planMinutes } from './routes'
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

// 앱(AlarmWatcher)이 알람을 맡았다고 서버에 알린다. 서버는 이 상태(SCHEDULED)인 예약만
// 도착 후 '제때 탔음'으로 기록해 여유 시간 학습에 쓴다. 실패해도 알람은 그대로 울린다
export function confirmScheduled(reservationId, wakeTime) {
  return ackAlarmSync(reservationId, wakeTime).catch(() => null)
}

// 선택한 경로로 기상·출발 시각을 계산하고 서버에 예약을 저장한다
export async function planAlarm(state, option = state.routeDetail) {
  const preparationMinutes = await resolvePrepMinutes(state)
  const bufferMinutes = state.settings.bufferMinutes
  // 기다리는 시간까지 넣은 최대 소요 시간으로 맞춘다 (ODsay 소요 시간에는 대기 시간이 없다)
  const routeMinutes = planMinutes(option)
  const arrival = nextArrival(state.arrival, state.days, routeMinutes + bufferMinutes + preparationMinutes + 1)
  const boarding = addMinutes(arrival, -(routeMinutes - option.walkToStop))

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
    routeMinutes,
    preparationMinutes,
    // 고른 경로를 함께 저장해야 서버 자동 점검·버스 놓침 대체 경로를 쓸 수 있다
    selectedPathJson: option.odsayPath ? JSON.stringify(option.odsayPath) : null,
    bufferMinutes,
  })
  const wakeTime = reservation.wakeTime ?? recommended.wakeTime
  await confirmScheduled(reservation.id, wakeTime)

  return {
    reservationId: reservation.id,
    wakeTime,
    leaveHomeTime: reservation.leaveHomeTime ?? recommended.leaveHomeTime,
    boardingTime: recommended.busBoardingTime,
    arrivalTime: toLocalDateTime(arrival),
    preparationMinutes,
    bus: option.name,
  }
}
