import { getBusApproach, matchBusArrivals } from '../api/transit'
import { addMinutes, clockLabel } from './time'
import { toRealtime } from './routes'

const toMinutes = (seconds) => Math.max(0, Math.ceil(seconds / 60))

// 0정류장 전은 버스가 내 정류장 바로 앞 구간에 있다는 뜻 (서울 안내 문구 '곧 도착')
export const stopsLabel = (remainingStops) => (remainingStops > 0 ? `${remainingStops}정류장 전` : '곧 도착')

// 받은 뒤 흐른 시간만큼 도착 시간을 줄인다
export function remainingSeconds(arrival, receivedAt, now = Date.now()) {
  return arrival.arrivalSeconds - (Number(now) - new Date(receivedAt).getTime()) / 1000
}

// 지금 집에서 나가도 탈 수 있는(도보 시간 이상 남은) 가장 빠른 버스
export function catchableArrival(arrivals, walkMinutes) {
  return arrivals.find((a) => a.arrivalSeconds >= walkMinutes * 60) ?? null
}

// 탈 수 있는 버스가 '도보 + 여유' 시간 안으로 들어오면 출발 알람을 울린다
export function shouldDepart(arrivals, walkMinutes, bufferMinutes) {
  const bus = catchableArrival(arrivals, walkMinutes)
  return Boolean(bus) && bus.arrivalSeconds <= (walkMinutes + Math.max(bufferMinutes, 1)) * 60
}

// TAGO 접근 정보를 실시간 카드 형식으로 변환
export function approachToRealtime(json, option, now = new Date()) {
  const [first, second] = json?.arrivals ?? []
  if (!first) return null
  const view = (a) => ({
    in: toMinutes(a.arrivalSeconds),
    at: clockLabel(addMinutes(now, a.arrivalSeconds / 60)),
    text: stopsLabel(a.remainingStops),
  })
  const head = view(first)
  return {
    bus: first.routeNo,
    sub: `${json.stopName} · ${head.text}`,
    arrivesIn: head.in,
    arrivesAt: head.at,
    arrivalText: head.text,
    remainingStops: first.remainingStops,
    stop: json.stopName,
    walk: option.walkToStop,
    next: second ? [{ label: `다음 ${second.routeNo}번`, ...view(second) }] : [],
    updatedAt: clockLabel(now),
  }
}

// 접근 정보(TAGO·서울)로 실시간 카드를 만들고, 둘 다 정류장을 못 찾으면 서울시 자동 매칭으로 한 번 더 찾는다
export async function loadRealtime(origin, destination, option) {
  if (option.approach) {
    const json = await getBusApproach(option.approach)
    if (json.status !== 'UNSUPPORTED_REGION') return approachToRealtime(json, option)
  }
  return toRealtime(await matchBusArrivals(origin, destination, option), option)
}
