import { addMinutes, clockLabel } from './time'

const SUBWAY = 1
const BUS = 2
const WALK = 3

const BUS_TYPES = {
  1: '일반', 2: '좌석', 3: '마을', 4: '직행', 5: '공항', 6: '간선급행', 10: '외곽',
  11: '간선', 12: '지선', 13: '순환', 14: '광역', 15: '급행', 16: '관광', 20: '농어촌', 26: '급행간선',
}

function sectionName(section) {
  const lane = section.lane?.[0]
  if (section.trafficType === BUS) return lane?.busNo ? `${lane.busNo}번` : '버스'
  return lane?.name ?? '지하철'
}

function sectionPoints(section) {
  const stations = section.passStopList?.stations
  if (stations?.length) return stations.map((s) => [Number(s.y), Number(s.x)])
  return [[Number(section.startY), Number(section.startX)], [Number(section.endY), Number(section.endX)]]
}

function buildSteps(sections, originName, destinationName) {
  const steps = []
  sections.forEach((section, i) => {
    if (section.trafficType === WALK) {
      if (!section.sectionTime) return
      const from = sections[i - 1]?.endName ?? originName
      const to = sections[i + 1]?.startName ?? destinationName
      const distance = section.distance ? ` (${section.distance}m)` : ''
      steps.push({ type: 'walk', title: `도보 ${section.sectionTime}분`, sub: `${from} → ${to}${distance}` })
      return
    }
    steps.push({ type: 'board', title: `${section.startName} 승차`, sub: sectionName(section) })
    steps.push({ type: 'ride', title: `${section.stationCount}개 정류장 이동`, sub: `약 ${section.sectionTime}분` })
    steps.push({ type: 'alight', title: `${section.endName} 하차`, sub: sectionName(section) })
  })
  steps.push({ type: 'arrive', title: `${destinationName} 도착`, sub: '' })
  return steps
}

function toOption(path, originName, destinationName) {
  const sections = path.subPath ?? []
  const total = path.info?.totalTime
  const transit = sections.filter((s) => s.trafficType === SUBWAY || s.trafficType === BUS)
  if (!total || transit.length === 0) return null

  const firstBus = transit.find((s) => s.trafficType === BUS)
  const first = sections.indexOf(transit[0])
  const walkToStop = sections.slice(0, first).reduce((sum, s) => sum + (s.sectionTime ?? 0), 0)
  const walk = sections.filter((s) => s.trafficType === WALK).reduce((sum, s) => sum + (s.sectionTime ?? 0), 0)
  const name = transit.map(sectionName).join(' → ')
  const transfers = transit.length - 1
  const mixed = firstBus && transit.some((s) => s.trafficType === SUBWAY)
  const boardBus = transit[0].trafficType === BUS ? transit[0] : null

  return {
    id: `${name}|${transit[0].startName}`,
    no: firstBus?.lane?.[0]?.busNo ?? null,
    busNos: (firstBus?.lane ?? []).map((lane) => lane.busNo),
    type: BUS_TYPES[firstBus?.lane?.[0]?.type] ?? '버스',
    name,
    stop: transit[0].startName,
    stopLat: Number(transit[0].startY),
    stopLng: Number(transit[0].startX),
    walk,
    walkToStop,
    ride: total - walk,
    total,
    // 백엔드가 소요 시간 하나만 주므로 최대값은 비워 둔다
    min: total,
    max: null,
    transfer: `${transfers ? `환승 ${transfers}회` : '환승 없음'}${mixed ? ' · 지하철 포함' : ''}`,
    path: transit.flatMap(sectionPoints),
    steps: buildSteps(sections, originName, destinationName),
    recommended: false,
    // 첫 탑승이 버스일 때만 실시간 접근 조회 (ODsay 지역 ID가 TAGO 정류소·노선 ID와 같은 체계)
    approach: boardBus && {
      stopId: boardBus.startLocalStationID ?? '',
      stopName: boardBus.startName,
      stopLat: Number(boardBus.startY),
      stopLng: Number(boardBus.startX),
      routeIds: (boardBus.lane ?? []).map((lane) => lane.busLocalBlID).filter(Boolean),
      busNos: (boardBus.lane ?? []).map((lane) => lane.busNo).filter(Boolean),
    },
  }
}

// ODsay 경로 검색 응답을 화면용 경로 목록으로 변환. 가장 빠른 버스 경로를 추천으로 표시한다.
export function toRouteOptions(json, originName, destinationName) {
  const options = (json?.result?.path ?? []).map((p) => toOption(p, originName, destinationName)).filter(Boolean)
  const best = options.filter((o) => o.no).sort((a, b) => a.total - b.total)[0]
  if (best) best.recommended = true
  return options
}

function arrival(seconds, text, now) {
  const value = Number(seconds)
  if (value > 0) return { in: Math.ceil(value / 60), at: clockLabel(addMinutes(now, value / 60)), text }
  return { in: null, at: null, text: text || '도착 정보 없음' }
}

// 선택한 노선의 실시간 도착 정보. 자동 매칭 결과에 그 노선이 없으면 null.
export function toRealtime(json, option, now = new Date()) {
  const found = (json?.busSections ?? []).flatMap((section) =>
    (section.buses ?? []).filter((b) => b.arrivalStatus === 'FOUND').map((b) => ({ ...b, stop: section.stationName })),
  )
  const bus = option.busNos.map((no) => found.find((b) => b.busNo === no)).find(Boolean)
  if (!bus) {
    if (json?.status === 'ARRIVAL_LOOKUP_FAILED') throw new Error('실시간 도착 정보를 불러오지 못했어요.')
    return null
  }

  const first = arrival(bus.firstArrivalSeconds, bus.firstArrival, now)
  const second = arrival(bus.secondArrivalSeconds, bus.secondArrival, now)
  return {
    bus: bus.busNo,
    sub: first.text,
    arrivesIn: first.in,
    arrivesAt: first.at,
    arrivalText: first.text,
    stop: bus.stop,
    walk: option.walkToStop,
    next: [{ label: '다음 버스', in: second.in, at: second.at, text: second.text }],
    updatedAt: clockLabel(now),
  }
}
