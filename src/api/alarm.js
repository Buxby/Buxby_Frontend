import { request } from './client'

// 탑승 시각·도보·여유·준비 시간으로 기상/출발 시각 계산
export function recommendAlarm(body) {
  return request('/api/alarms/recommend', { method: 'POST', body })
}

// body.selectedPathJson(ODsay 경로 JSON 문자열)·bufferMinutes는 선택 항목.
// 경로를 함께 저장하면 서버 자동 점검과 버스 놓침 대체 경로를 쓸 수 있다
export function createReservation(body) {
  return request('/api/alarm-reservations', { method: 'POST', body })
}

// 예약 자체를 지운다 (알람을 다른 예약으로 바꿀 때)
export function deleteReservation(id) {
  return request(`/api/alarm-reservations/${id}`, { method: 'DELETE' })
}

// 사용자가 알람을 취소. 예약은 CANCELLED로 남아 이동 기록 학습에 쓰인다
export function cancelReservation(id) {
  return request(`/api/alarm-operations/${id}/cancel`, { method: 'POST' })
}

// 서버 예약 상태 목록. clientAction으로 기기 알람을 어떻게 맞출지 알려준다
export function getAlarmSync() {
  return request('/api/alarm-sync')
}

// 기기(앱)에 알람을 맞췄다고 서버에 알린다. 서버 기상 시각이 바뀌었으면 409
export function ackAlarmSync(id, expectedWakeTime) {
  return request(`/api/alarm-sync/${id}/ack`, { method: 'POST', body: { expectedWakeTime } })
}

export function predictPreparation() {
  return request('/api/preparation/predict')
}

export function recordPreparation(body) {
  return request('/api/preparation/records', { method: 'POST', body })
}

// 최초 준비 시간 설정 여부 ({ configured, preparationMinutes })
export function getPreparationSetup() {
  return request('/api/preparation/setup')
}

// 최초 준비 시간 저장 (기록이 없을 때 예측값으로 쓰인다). 이미 있으면 409
export function setupPreparation(minutes) {
  return request('/api/preparation/setup', { method: 'POST', body: { minutes } })
}

// 버스를 놓친 기록이 쌓이면 늘어나는 추천 여유 시간 ({ bufferMinutes }, 5~15분)
export function getRecommendedBuffer() {
  return request('/api/transit-outcomes/recommended-buffer')
}

// 버스를 놓쳤다고 기록 (이동 결과 MISSED로 저장)
export function reportMissedBus(reservationId) {
  return request('/api/missed-bus', { method: 'POST', body: { reservationId } })
}

// 현재 위치에서 목적지까지 대체 경로 (예약에 경로 정보가 없으면 409)
export function rerouteMissedBus(reservationId, position) {
  return request('/api/missed-bus/reroute', {
    method: 'POST',
    body: { reservationId, currentLongitude: position.lng, currentLatitude: position.lat },
  })
}
