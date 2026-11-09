import { request } from './client'

// 탑승 시각·도보·여유·준비 시간으로 기상/출발 시각 계산
export function recommendAlarm(body) {
  return request('/api/alarms/recommend', { method: 'POST', body })
}

export function createReservation(body) {
  return request('/api/alarm-reservations', { method: 'POST', body })
}

export function deleteReservation(id) {
  return request(`/api/alarm-reservations/${id}`, { method: 'DELETE' })
}

export function predictPreparation() {
  return request('/api/preparation/predict')
}

export function recordPreparation(body) {
  return request('/api/preparation/records', { method: 'POST', body })
}
