import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppStateContext } from './context'
import { DEFAULT_PREP } from '../data/mock'

const STORAGE_KEY = 'buxby-state-v1'

const DEFAULT_STATE = {
  category: '수업',
  destination: null,
  arrival: null,
  days: ['월', '화', '수', '목', '금'],
  origin: null,
  route: null,
  routeDetail: null, // 선택한 경로 (ODsay 응답 변환값)
  routeOptions: null, // 현재 출발지·목적지의 경로 목록
  busCongestion: null, // 선택한 경로의 실시간 혼잡도 정보
  subwayArrivals: null, // 선택한 경로의 지하철 실시간 도착정보
  lastRealtime: null, // 마지막으로 받은 실시간 도착 정보
  plan: null, // 서버에 저장한 알람 계획
  wakeOffAt: null, // 기상 알람을 끈 시각 (준비 시간 기록용)
  alarmFired: {}, // { wake, depart, safety, dismissed }: 이미 울렸거나 끈 알람의 예약 ID
  snooze: null, // { reservationId, until, count }: 미뤄 둔 기상 알람
  lastApproach: null, // 출발 알람 판단에 쓴 마지막 버스 접근 정보 (+ receivedAt)
  alarmSet: false,
  permissionsDone: false,
  prep: DEFAULT_PREP,
  prepMode: 'items', // 'items' 항목별 입력 | 'total' 한 번에 입력
  prepTotal: null,
  settings: {
    autoAdjust: true,
    snoozeLimitMinutes: 20, // 처음 기상 시각부터 최대 몇 분까지 미룰 수 있는지
    snoozeMinutes: 10, // 한 번 미룰 때 몇 분 뒤에 다시 울릴지
    bufferMinutes: 10,
    safetyAlarm: true,
    departNotify: true,
    delayNotify: true,
    notifications: true,
    exactAlarm: true,
  },
}

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_STATE
    const parsed = JSON.parse(saved)
    // 예전 버전의 미루기 상한(오전 6:45 같은 고정 시각)은 분 단위 설정으로 바뀌어 버린다
    const settings = { ...parsed.settings }
    delete settings.snoozeLimit
    return {
      ...DEFAULT_STATE,
      ...parsed,

      // 새로고침하면 실시간 혼잡도 초기화
      busCongestion: null,
      subwayArrivals: null,

      settings: {
        ...DEFAULT_STATE.settings,
        ...settings,
      },
    }
  } catch {
    return DEFAULT_STATE
  }
}

// 일정·알람 설정을 기기 브라우저에 저장
export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      // 실시간 교통정보는 localStorage에 저장하지 않음
      const persistedState = { ...state }

      delete persistedState.busCongestion
      delete persistedState.subwayArrivals

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(persistedState)
      )

    } catch {
      // 저장소를 쓸 수 없는 환경에서는 메모리 상태만 유지
    }
  }, [state])

  const update = useCallback((patch) => setState((prev) => ({ ...prev, ...patch })), [])
  const setSetting = useCallback(
    (key, value) => setState((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } })),
    [],
  )
  const reset = useCallback(() => setState(DEFAULT_STATE), [])

  const value = useMemo(() => ({ state, update, setSetting, reset }), [state, update, setSetting, reset])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
