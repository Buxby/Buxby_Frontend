// 퍼블리싱용 예시 데이터 — 사업계획서 8장 시안 수치를 따름.
// 노선·알람 API(백엔드)가 준비되면 이 값을 API 응답으로 바꾼다.

export const PLACES = {
  home: { name: '내 집', address: '서울 구로구 구로동', lat: 37.4878, lng: 126.8983 },
  stop: { name: '구로디지털단지역 정류장', lat: 37.4852, lng: 126.9013 },
  destination: { name: '동양미래대학교', address: '서울 구로구 경인로 445', lat: 37.5004, lng: 126.8677 },
}

export const DESTINATION_RESULTS = [
  { id: 'dmu', name: '동양미래대학교', address: '서울 구로구 경인로 445', category: '대학교', lat: 37.5004, lng: 126.8677 },
  { id: 'dmu-gate', name: '동양미래대학교 정문', address: '서울 구로구 고척동 · 버스정류장', category: '정류장', lat: 37.5009, lng: 126.8686 },
  { id: 'dmu-7', name: '동양미래대학교 7호관', address: '서울 구로구 경인로 445', category: '건물', lat: 37.5001, lng: 126.8669 },
]

export const RECENT_SEARCHES = ['동양미래대학교', '구로디지털단지역']

export const ORIGIN_LABELS = ['집', '기숙사', '직접 입력']

export const ROUTE_OPTIONS = [
  { no: '160', type: '간선', stop: '구로디지털단지역 정류장', walk: 8, min: 28, max: 41, headway: 9, recommended: true },
  { no: '503', type: '간선', stop: '구로역 정류장', walk: 11, min: 31, max: 45, headway: 12 },
  { no: '6513', type: '지선', stop: '고척동 정류장', walk: 5, min: 35, max: 52, headway: 15 },
]

export const ALARM = {
  wake: '6:28',
  wakeLabel: '오전 6:28',
  dayLabel: '내일(목)',
  date: '10월 15일 (목)',
  depart: '7:00',
  board: '7:12',
  arrive: '7:28~7:41',
  snoozeLimit: '6:45',
  postponedTo: '6:40',
  postponedNow: '6:20',
}

export const RECOMMEND = {
  bus: '160',
  sub: '지금 도착 예정',
  arrivesIn: 7,
  arrivesAt: '오전 7:12',
  stop: '구로디지털단지역 정류장',
  walk: 8,
  total: 32,
  min: 28,
  max: 41,
  next: [
    { label: '다음 버스', in: 18, at: '오전 7:23' },
    { label: '그다음 버스', in: 32, at: '오전 7:37' },
  ],
  updatedAt: '오전 7:05',
}

// 버스 도착까지 이 시간(분) 이하이면 도착 시간을 빨간색으로 표시
export const URGENT_MINUTES = 5

// C6 곧 도착 예시: 도착 4분 전
export const RECOMMEND_SOON = {
  arrivesIn: 4,
  arrivesAt: '오전 7:09',
  next: [
    { label: '다음 버스', in: 15, at: '오전 7:20' },
    { label: '그다음 버스', in: 29, at: '오전 7:34' },
  ],
}

export const ROUTE_STEPS = [
  { type: 'walk', title: '도보 8분', sub: '집 → 구로디지털단지역 정류장 (550m)' },
  { type: 'board', title: '구로디지털단지역 정류장 승차', sub: '160번 · 7분 후 도착 (오전 7:12)' },
  { type: 'ride', title: '12개 정류장 이동', sub: '약 17분 · 도로 상황에 따라 최대 +13분' },
  { type: 'alight', title: '동양미래대학 정류장 하차', sub: '오전 7:29 예정' },
  { type: 'walk', title: '도보 3분', sub: '정류장 → 동양미래대학교 정문 (200m)' },
  { type: 'arrive', title: '동양미래대학교 도착', sub: '오전 7:32 예정 · 수업 9:00' },
]

export const ROUTE_COMPARE = [
  { id: 'a', name: '160번', min: 28, max: 41, walk: 8, ride: 17, transfer: '환승 없음', recommended: true },
  { id: 'b', name: '503번 → 6614번', min: 33, max: 48, walk: 11, ride: 22, transfer: '환승 1회' },
  { id: 'c', name: '지하철 2호선 → 마을버스', min: 30, max: 39, walk: 14, ride: 16, transfer: '환승 1회 · 지하철 포함' },
]

export const DELAY = {
  minutes: 12,
  before: '오전 7:12',
  after: '오전 7:24',
  alternatives: [
    { group: 'next', type: 'bus', route: '160번', tag: '(다음 버스)', sub: '오전 7:32' },
    { group: 'other', type: 'alt', route: '503번', tag: '(대체 노선)', sub: '오전 7:36' },
    { group: 'drt', type: 'drt', route: '똑버스(DRT) 안내', sub: '운행 지역·시간 확인하기' },
  ],
}

// DRT는 운행 지역·시간만 안내하고 호출은 운영사 앱으로 연결 (중간발표 Q9·Q17)
export const DRT_INFO = {
  rows: [
    ['운행 지역', '광명시 똑버스 권역 (2026년 운행 시작)'],
    ['운영 시간', '평일 06:00 ~ 23:00 (예시)'],
    ['이용 방법', '운영사 앱에서 호출·결제'],
  ],
  // 운영사 앱 연결 주소는 확인 후 넣는다. 없으면 안내 문구만 보여준다.
  operatorUrl: null,
}

export const PREP_BY_DAY = [
  { day: '월', minutes: 30, highlight: true },
  { day: '화', minutes: 28, highlight: true },
  { day: '수', minutes: 18, highlight: false },
  { day: '목', minutes: 29, highlight: true },
  { day: '금', minutes: 31, highlight: true },
  { day: '토', minutes: 40, highlight: false },
  { day: '일', minutes: 22, highlight: false },
]

export const DEFAULT_PREP = [
  { id: 'wake', icon: 'bed', name: '기상 후 침대에서 일어나기', minutes: 5 },
  { id: 'wash', icon: 'shower', name: '세면 및 샤워', minutes: 15 },
  { id: 'dress', icon: 'shirt', name: '옷 입기', minutes: 7 },
  { id: 'bag', icon: 'bag', name: '가방 준비', minutes: 4 },
]

export const LEARNING = { averageMinutes: 32, requiredDays: 7, manualMinutes: 30 }
