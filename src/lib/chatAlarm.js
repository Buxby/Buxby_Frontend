import { toRouteOption } from './routes'
import { addMinutes, toLocalDateTime } from './time'

const WEEKDAYS = '일월화수목금토'

// '[이름 / 주소]' 형태로 답에 들어 있는 목적지 후보를 뽑는다 (SELECT_DESTINATION)
export function parsePlaceCandidates(reply) {
  const found = []
  for (const match of String(reply ?? '').matchAll(/\[([^[\]]+?) \/ ([^[\]]+?)\]/g)) {
    found.push({ name: match[1].trim(), address: match[2].trim() })
  }
  return found
}

// 버스·지하철 놓침 문장 (백엔드 ChatService.isMissedTransit과 같은 기준)
export function isMissedTransit(text) {
  const t = String(text ?? '').replace(/\s/g, '')
  const transit = ['버스', '지하철', '전철', '열차'].some((w) => t.includes(w))
  const missed = ['놓쳤', '놓침', '못탔', '못탐'].some((w) => t.includes(w))
  return transit && missed
}

// 마지막 대중교통 구간의 하차 지점 (ODsay 경로에는 목적지 좌표가 따로 없다)
function lastStop(path) {
  const sections = (path?.subPath ?? []).filter((s) => s.trafficType === 1 || s.trafficType === 2)
  const last = sections[sections.length - 1]
  return last ? { lat: Number(last.endY), lng: Number(last.endX) } : null
}

// AI 비서가 저장한 예약을 홈 화면 알람(일정·노선·알람 계획)으로 바꾼다. 변환할 수 없으면 null
export function chatAlarmState(journey, reservationId, origin) {
  const path = journey?.route?.selectedPath
  const destinationName = journey?.interpreted?.destination || '목적지'
  const option = toRouteOption(path, origin?.name ?? '출발지', destinationName)
  const goal = lastStop(path)
  if (!option || !goal || !journey.wakeTime || !journey.leaveHomeTime || !journey.desiredArrivalTime) return null

  const arrival = new Date(journey.desiredArrivalTime)
  const hour24 = arrival.getHours()
  return {
    destination: { name: destinationName, lat: goal.lat, lng: goal.lng },
    arrival: { ampm: hour24 < 12 ? '오전' : '오후', hour: hour24 % 12 || 12, minute: arrival.getMinutes() },
    days: [WEEKDAYS[arrival.getDay()]],
    route: option.no ?? option.name,
    // 버스 없이 지하철만 타는 경로면 노선 유형을 지하철로 보여준다
    routeDetail: { ...option, type: option.no ? option.type : '지하철', recommended: true },
    plan: {
      reservationId,
      wakeTime: journey.wakeTime,
      leaveHomeTime: journey.leaveHomeTime,
      boardingTime: toLocalDateTime(addMinutes(new Date(journey.leaveHomeTime), option.walkToStop)),
      arrivalTime: journey.desiredArrivalTime,
      preparationMinutes: journey.preparationMinutes,
      bus: option.name,
    },
    alarmSet: true,
    snooze: null,
    wakeOffAt: null,
    lastApproach: null,
    busCongestion: null,
    subwayArrivals: null,
  }
}
