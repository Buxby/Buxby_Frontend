
import { addMinutes, clockLabel } from './time'

const SUBWAY = 1
const BUS = 2
const WALK = 3

const BUS_TYPES = {
  1: '일반', 2: '좌석', 3: '마을', 4: '직행', 5: '공항',
  6: '간선급행', 10: '외곽', 11: '간선', 12: '지선',
  13: '순환', 14: '광역', 15: '급행', 16: '관광',
  20: '농어촌', 26: '급행간선',
}

// 좌표를 안전하게 숫자로 변환
function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

// ODsay 구간 이름
function sectionName(section) {
  const lane = section.lane?.[0]

  if (section.trafficType === BUS) {
    return lane?.busNo ? `${lane.busNo}번` : '버스'
  }

  return lane?.name ?? '지하철'
}

// 지도 경로 좌표
function sectionPoints(section) {
  const stations = section.passStopList?.stations

  if (stations?.length) {
    return stations.map((s) => [
      Number(s.y),
      Number(s.x),
    ])
  }

  return [
    [Number(section.startY), Number(section.startX)],
    [Number(section.endY), Number(section.endX)],
  ]
}


// =====================================
// 모든 버스 구간 정보 추출
// =====================================

function extractBusSegments(sections) {

  return sections.flatMap((section, sectionIndex) => {

    // 버스 구간이 아니면 제외
    if (section.trafficType !== BUS) {
      return []
    }

    // 해당 구간의 버스 노선 정보
    const lanes = (section.lane ?? [])
      .map((lane) => {

        const busNo = lane.busNo == null
          ? null
          : String(lane.busNo)

        const busRouteId = lane.busLocalBlID == null
          ? null
          : String(lane.busLocalBlID)

        return {
          busNo,
          busRouteId,
          name: lane.name ?? null,
          type: lane.type ?? null,
        }
      })
      .filter((lane) => lane.busNo || lane.busRouteId)

    // 버스 번호 중복 제거
    const busNos = [
      ...new Set(
        lanes
          .map((lane) => lane.busNo)
          .filter(Boolean)
      ),
    ]

    // 노선 ID 중복 제거
    const busRouteIds = [
      ...new Set(
        lanes
          .map((lane) => lane.busRouteId)
          .filter(Boolean)
      ),
    ]

    return [{
      // 전체 경로에서 이 버스 구간의 순서
      sectionIndex,

      // 승차 및 하차 정류장
      boardingStationName: section.startName ?? '',
      alightingStationName: section.endName ?? '',

      // 정류장 고유 ID
      boardingStationId: section.startLocalStationID ?? null,
      boardingArsId: section.startArsID ?? null,

      alightingStationId: section.endLocalStationID ?? null,
      alightingArsId: section.endArsID ?? null,

      // 승차 및 하차 위치
      boardingLatitude: toNumberOrNull(section.startY),
      boardingLongitude: toNumberOrNull(section.startX),

      alightingLatitude: toNumberOrNull(section.endY),
      alightingLongitude: toNumberOrNull(section.endX),

      // 이동 정보
      sectionTime: section.sectionTime ?? null,
      stationCount: section.stationCount ?? null,

      // 버스 정보
      busNos,
      busRouteIds,
      lanes,
    }]
  })
}


// =====================================
// 경로 상세 단계 생성
// =====================================

function buildSteps(sections, originName, destinationName) {

  const steps = []

  sections.forEach((section, i) => {

    if (section.trafficType === WALK) {

      if (!section.sectionTime) return

      const from = sections[i - 1]?.endName ?? originName
      const to = sections[i + 1]?.startName ?? destinationName

      const distance = section.distance
        ? ` (${section.distance}m)`
        : ''

      steps.push({
        type: 'walk',
        title: `도보 ${section.sectionTime}분`,
        sub: `${from} → ${to}${distance}`,
      })

      return
    }

    steps.push({
      type: 'board',
      title: `${section.startName} 승차`,
      sub: sectionName(section),
    })

    steps.push({
      type: 'ride',
      title: `${section.stationCount}개 정류장 이동`,
      sub: `약 ${section.sectionTime}분`,
    })

    steps.push({
      type: 'alight',
      title: `${section.endName} 하차`,
      sub: sectionName(section),
    })
  })

  steps.push({
    type: 'arrive',
    title: `${destinationName} 도착`,
    sub: '',
  })

  return steps
}


// =====================================
// ODsay 경로를 화면용 객체로 변환
// =====================================

function toOption(path, originName, destinationName) {

  const sections = path.subPath ?? []
  const total = path.info?.totalTime

  const transit = sections.filter(
    (s) =>
      s.trafficType === SUBWAY ||
      s.trafficType === BUS
  )

  if (!total || transit.length === 0) {
    return null
  }

  // 첫 번째 버스 구간
  const firstBus = transit.find(
    (s) => s.trafficType === BUS
  )

  // 모든 버스 구간 추출
  const busSegments = extractBusSegments(sections)

  // 전체 경로의 고유 버스 노선 ID
  const busRouteIds = [
    ...new Set(
      busSegments.flatMap(
        (segment) => segment.busRouteIds
      )
    ),
  ]

  // 전체 경로의 버스 번호
  const allBusNos = [
    ...new Set(
      busSegments.flatMap(
        (segment) => segment.busNos
      )
    ),
  ]

  const first = sections.indexOf(transit[0])

  const walkToStop = sections
    .slice(0, first)
    .reduce(
      (sum, s) => sum + (s.sectionTime ?? 0),
      0
    )

  const walk = sections
    .filter((s) => s.trafficType === WALK)
    .reduce(
      (sum, s) => sum + (s.sectionTime ?? 0),
      0
    )

  const name = transit
    .map(sectionName)
    .join(' → ')

  const transfers = transit.length - 1

  const mixed =
    firstBus &&
    transit.some((s) => s.trafficType === SUBWAY)

  const boardBus =
    transit[0].trafficType === BUS
      ? transit[0]
      : null

  return {

    id: `${name}|${transit[0].startName}`,

    // 기존 화면 및 알람 기능에서 사용하는 데이터
    no: firstBus?.lane?.[0]?.busNo ?? null,

    busNos: (firstBus?.lane ?? [])
      .map((lane) => lane.busNo),

    type:
      BUS_TYPES[firstBus?.lane?.[0]?.type] ?? '버스',

    name,

    stop: transit[0].startName,

    stopLat: Number(transit[0].startY),
    stopLng: Number(transit[0].startX),

    walk,
    walkToStop,
    ride: total - walk,
    total,

    min: total,
    max: null,

    transfer:
      `${transfers ? `환승 ${transfers}회` : '환승 없음'}${mixed ? ' · 지하철 포함' : ''}`,

    path: transit.flatMap(sectionPoints),

    steps: buildSteps(
      sections,
      originName,
      destinationName
    ),

    recommended: false,

    // =====================================
    // 신규: 전체 버스 구간 정보
    // =====================================

    busSegments,

    // 경로에 포함된 모든 버스 노선 ID
    busRouteIds,

    // 경로에 포함된 모든 버스 번호
    allBusNos,

    // =====================================
    // 기존 출발 알람 기능 유지
    // =====================================

    approach: boardBus && {

      stopId: boardBus.startLocalStationID ?? '',

      stopName: boardBus.startName,

      stopLat: Number(boardBus.startY),

      stopLng: Number(boardBus.startX),

      routeIds: (boardBus.lane ?? [])
        .map((lane) => lane.busLocalBlID)
        .filter(Boolean),

      busNos: (boardBus.lane ?? [])
        .map((lane) => lane.busNo)
        .filter(Boolean),
    },
  }
}


// =====================================
// 경로 검색 응답 변환
// =====================================

export function toRouteOptions(
  json,
  originName,
  destinationName
) {

  const options = (
    json?.result?.path ?? []
  )
    .map((p) =>
      toOption(p, originName, destinationName)
    )
    .filter(Boolean)

  // 기존 추천 경로 선정 방식 유지
  const best = options
    .filter((o) => o.no)
    .sort((a, b) => a.total - b.total)[0]

  if (best) {
    best.recommended = true
  }

  return options
}


// =====================================
// 실시간 도착정보 변환
// =====================================

function arrival(seconds, text, now) {

  const value = Number(seconds)

  if (value > 0) {

    return {
      in: Math.ceil(value / 60),
      at: clockLabel(
        addMinutes(now, value / 60)
      ),
      text,
    }
  }

  return {
    in: null,
    at: null,
    text: text || '도착 정보 없음',
  }
}


// 선택한 노선의 실시간 도착 정보
export function toRealtime(
  json,
  option,
  now = new Date()
) {

  const found = (json?.busSections ?? [])
    .flatMap((section) =>
      (section.buses ?? [])
        .filter(
          (b) => b.arrivalStatus === 'FOUND'
        )
        .map((b) => ({
          ...b,
          stop: section.stationName,
        }))
    )

  // 기존 동작 유지: 첫 번째 버스 구간의 번호로 검색
  const bus = option.busNos
    .map((no) =>
      found.find((b) => b.busNo === no)
    )
    .find(Boolean)

  if (!bus) {

    if (json?.status === 'ARRIVAL_LOOKUP_FAILED') {
      throw new Error(
        '실시간 도착 정보를 불러오지 못했어요.'
      )
    }

    return null
  }

  const first = arrival(
    bus.firstArrivalSeconds,
    bus.firstArrival,
    now
  )

  const second = arrival(
    bus.secondArrivalSeconds,
    bus.secondArrival,
    now
  )

  return {

    bus: bus.busNo,

    sub: first.text,

    arrivesIn: first.in,

    arrivesAt: first.at,

    arrivalText: first.text,

    stop: bus.stop,

    walk: option.walkToStop,

    next: [{
      label: '다음 버스',
      in: second.in,
      at: second.at,
      text: second.text,
    }],

    updatedAt: clockLabel(now),
  }
}
