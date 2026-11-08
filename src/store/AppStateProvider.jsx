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
  alarmSet: false,
  permissionsDone: false,
  prep: DEFAULT_PREP,
  prepMode: 'items', // 'items' 항목별 입력 | 'total' 한 번에 입력
  prepTotal: null,
  records: 14,
  settings: {
    autoAdjust: true,
    snoozeLimit: '오전 6:45',
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
    return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } }
  } catch {
    return DEFAULT_STATE
  }
}

// 일정·알람 설정을 기기 브라우저에 저장 (백엔드 알람 API 연동 전까지 사용)
export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리 상태만 유지
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
