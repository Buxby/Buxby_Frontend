
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

// ODsay BIS 제공기관 코드별 지역명
const BIS_PROVIDER_NAMES = {
  2: '경기',
  3: '대전',
  4: '서울',
  5: '군산',
  6: '인천',
  7: '울산',
  8: '광주',
  9: '경기 마을버스',
  10: '서울 마을버스',
  11: '부산',
  12: '창원',
  13: '대구',
  14: '경산',
  15: '제주',
  16: '세종',
  17: '청주',
  18: '포항',
  19: '거제',
  20: '아산',
  21: '천안',
  22: '춘천',
  23: '강릉',
  25: '원주',
  26: '양산',
  27: '전주',
  28: '목포',
  29: '밀양',
  30: '경주',
  31: '광양',
  32: '순천',
  33: '여수',
  34: '진주',
  35: '통영',
  36: '구미',
  37: '김천',
  38: '김해',
  39: '속초',
  40: '동해',
  41: '태백',
  42: '삼척',
  43: '평창군',
  44: '홍천군',
  45: '영월군',
  46: '정선군',
  47: '철원군',
  48: '화천군',
  49: '양구군',
  50: '인제군',
  51: '고성군',
  52: '양양군',
  53: '논산',
  54: '서산',
  55: '영주',
  56: '칠곡군',
  57: '익산',
  58: '정읍',
  59: '강진',
  60: '영광',
  61: '함평',
  62: '무주',
  63: '순창',
  64: '임실',
  65: '장수',
  66: '진안',
  67: '부여',
  70: '충주',
}

// 배차 간격 상한과 간격 정보가 없을 때 기본값(분) — 백엔드 JourneyTimeEstimator와 같은 규칙
const MAX_HEADWAY = 30
const DEFAULT_HEADWAY = 10
const Z90 = 1.2816 // 10번 중 9번은 이 대기 시간 안에 탄다

// 버스·지하철 대기 시간 (분). 정류장에 아무 때나 도착하면 대기는 0~배차 간격(H)에 고르게 퍼지므로
// 구간별 평균 H/2, 분산 H²/12를 더해 보통(평균)과 늦을 때(90% 지점)를 구한다.
// 모든 구간에서 최대로 기다리는 경우를 더하면 범위가 지나치게 넓어진다
export function waitEstimate(transitSections) {
  let mean = 0
  let variance = 0
  let worst = 0
  for (const s of transitSections) {
    const interval = Number(s.intervalTime)
    const headway = interval > 0 ? Math.min(interval, MAX_HEADWAY) : DEFAULT_HEADWAY
    mean += headway / 2
    variance += (headway * headway) / 12
    worst += headway
  }
  // 백엔드 Math.round와 같게 반올림 (.5는 올림)
  const expected = Math.floor(mean + 0.5)
  const p90 = Math.min(worst, Math.floor(mean + Z90 * Math.sqrt(variance) + 0.5))
  return { expected, p90: Math.max(expected, p90) }
}

// 알람 계산에 쓰는 이동 시간 (최대 소요 시간, 예전에 저장한 경로는 total)
export function planMinutes(option) {
  return option.max ?? option.total
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

      // ODsay BIS 제공기관 코드
      const providerCode = toNumberOrNull(
        lane.busProviderCode
        ?? section.startStationProviderCode
      )

      // 운수회사 승인 도시 코드
      const busCityCode = toNumberOrNull(
        lane.busCityCode
        ?? section.startStationCityCode
      )

      // 운행지역 이름
      const busCityName =
        lane.busCityNameKor
        ?? lane.busCityName
        ?? null

      // =====================================
      // BIS 제공기관 기반 지역 판별
      // =====================================

      let provider = 'UNKNOWN'

      // BIS 제공기관 코드가 가장 우선
      switch (providerCode) {

        // 서울
        case 4:
        case 10:
          provider = 'SEOUL'
          break

        // 경기
        case 2:
        case 9:
          provider = 'GYEONGGI'
          break

        // 인천
        case 6:
          provider = 'INCHEON'
          break

        // 그 외 지자체
        default:
          if (providerCode !== null) {
            provider = 'OTHER_BIS'
          } else if (busCityCode === 1000) {
            // BIS 코드가 없지만 서울 도시코드인 경우
            provider = 'SEOUL'
          }
      }

      // 실제 BIS 제공기관 이름
      const providerName =
        BIS_PROVIDER_NAMES[providerCode]
        ?? busCityName
        ?? '확인 불가'

      return {
        busNo,
        busRouteId,

        busId: lane.busID == null
          ? null
          : String(lane.busID),

        name: lane.name ?? null,
        type: lane.type ?? null,

        // 지역별 API 구분 정보
        provider,
        providerName,
        providerCode,
        busCityCode,
        busCityName,
      }
    })
    .filter((lane) => lane.busNo || lane.busRouteId || lane.busId)


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
// 모든 지하철 구간 정보 추출
// =====================================

function extractSubwaySegments(sections) {

  return sections.flatMap((section, sectionIndex) => {

    // 지하철 구간이 아니면 제외
    if (section.trafficType !== SUBWAY) {
      return []
    }

    // 지하철 노선 정보
    const lanes = (section.lane ?? []).map((lane) => ({
      name: lane.name ?? '지하철',
      subwayCode: lane.subwayCode ?? null,
      subwayCityCode: lane.subwayCityCode ?? null,
    }))

    // 지하철 구간에 포함된 역 정보
    const stations = (section.passStopList?.stations ?? [])
      .map((station, index) => ({
        order: station.index ?? index,
        stationName: station.stationName ?? station.name ?? '',
        stationId: station.stationID ?? station.stationId ?? null,
        latitude: toNumberOrNull(station.y),
        longitude: toNumberOrNull(station.x),
      }))
      .filter((station) => station.stationName)

    // 승차역과 하차역을 포함한 전체 역 이름
    const stationNames = [
      section.startName,
      ...stations.map((station) => station.stationName),
      section.endName,
    ].filter(Boolean)

    // 역 이름 중복 제거
    const uniqueStationNames = [
      ...new Set(stationNames),
    ]

    // 노선 이름 중복 제거
    const lineNames = [
      ...new Set(
        lanes
          .map((lane) => lane.name)
          .filter(Boolean)
      ),
    ]

    return [{
      // 전체 경로에서 지하철 구간의 순서
      sectionIndex,

      // 승차 및 하차역
      boardingStationName: section.startName ?? '',
      alightingStationName: section.endName ?? '',

      // 승하차역 좌표
      boardingLatitude: toNumberOrNull(section.startY),
      boardingLongitude: toNumberOrNull(section.startX),

      alightingLatitude: toNumberOrNull(section.endY),
      alightingLongitude: toNumberOrNull(section.endX),

      // 지하철 노선 정보
      lineNames,
      lanes,

      // 이동 정보
      sectionTime: section.sectionTime ?? null,
      stationCount: section.stationCount ?? null,

      // 해당 구간의 역 목록
      stationNames: uniqueStationNames,
      stations,

      // ODsay 원본 방향 정보
      way: section.way ?? null,
      wayCode: section.wayCode ?? null,
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

  // =====================================
  // 지역별 버스 API 요청 대상 생성
  // =====================================

  const busTargetMap = new Map()

  busSegments.forEach((segment) => {

    segment.lanes.forEach((lane) => {

      if (!lane.busRouteId && !lane.busId) return

      // 지역 및 제공기관이 다른 노선은 구분
      const key = [
        lane.providerCode ?? 'UNKNOWN',
        lane.busCityCode ?? 'UNKNOWN',
        lane.busRouteId ?? lane.busId,
      ].join(':')

      if (busTargetMap.has(key)) return

      busTargetMap.set(key, {
        busNo: lane.busNo,
        busRouteId: lane.busRouteId,
        busId: lane.busId,

        provider: lane.provider,
        providerName: lane.providerName,
        providerCode: lane.providerCode,
        busCityCode: lane.busCityCode,
        busCityName: lane.busCityName,

        sectionIndex: segment.sectionIndex,

        boardingStationName:
          segment.boardingStationName,

        boardingStationId:
          segment.boardingStationId,

        boardingArsId:
          segment.boardingArsId,
      })
    })
  })

  const busTargets = [...busTargetMap.values()]


    // 모든 지하철 구간 추출
  const subwaySegments = extractSubwaySegments(sections)

  // 전체 경로의 지하철 승차역
  const subwayStationNames = [
    ...new Set(
      subwaySegments
        .map((segment) => segment.boardingStationName)
        .filter(Boolean)
    ),
  ]

  // 전체 경로의 지하철 노선명
  const allSubwayLines = [
    ...new Set(
      subwaySegments.flatMap(
        (segment) => segment.lineNames
      )
    ),
  ]

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
  const wait = waitEstimate(transit)

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

    // ODsay totalTime은 타고 걷는 시간만의 합이라 기다리는 시간이 없다.
    // min = 보통(평균 대기), max = 늦을 때(90% 대기) — 알람은 max 기준으로 맞춘다
    min: total + wait.expected,
    max: total + wait.p90,
    waitExpected: wait.expected,

    transfer:
      `${transfers ? `환승 ${transfers}회` : '환승 없음'}${mixed ? ' · 지하철 포함' : ''}`,

    path: transit.flatMap(sectionPoints),

    steps: buildSteps(
      sections,
      originName,
      destinationName
    ),

    recommended: false,

    // ODsay 원본 경로. 알람 예약에 함께 저장하면 서버가 자동 점검·버스 놓침 대체 경로에 쓴다
    odsayPath: path,

    // =====================================
    // 신규: 전체 버스 구간 정보
    // =====================================

    busSegments,

    // 경로에 포함된 모든 버스 노선 ID
    busRouteIds,

    // 경로에 포함된 모든 버스 번호
    allBusNos,

    // 지역별 API를 호출하기 위한 버스 정보
    busTargets,

    // =====================================
    // 신규: 전체 지하철 구간 정보
    // =====================================

    subwaySegments,

    // 경로에 포함된 모든 지하철 승차역
    subwayStationNames,

    // 경로에 포함된 전체 지하철 노선명
    allSubwayLines,

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

// ODsay 경로 하나를 화면용 경로로 변환 (AI 비서가 계산한 경로 등). 대중교통이 없으면 null
export function toRouteOption(path, originName, destinationName) {
  return path ? toOption(path, originName, destinationName) : null
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
