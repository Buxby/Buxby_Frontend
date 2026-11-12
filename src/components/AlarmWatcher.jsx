import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getBusApproach } from '../api/transit'
import { catchableArrival, remainingSeconds, shouldDepart, stopsLabel } from '../lib/busApproach'
import { activeSnooze, snoozeLimitAt } from '../lib/snooze'
import { useAppState } from '../store/context'

const TICK_MS = 15000
const POLL_MS = 30000
const LOOKAHEAD_MIN = 15 // 출발 예정 15분 전부터 버스 접근을 조회
const GRACE_MIN = 30 // 예정 시각이 30분 넘게 지나면 울리지 않는다

const minutes = (n) => n * 60000

function notify(enabled, title, body) {
  if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch {
    // 모바일 브라우저처럼 페이지에서 바로 알림을 만들 수 없는 환경은 화면 전환만 한다
  }
}

// 앱이 열려 있는 동안 기상 시각과 실시간 버스 접근을 보고 알람 화면을 띄운다.
// 출발 알람: 탈 수 있는 버스가 '도보 + 여유' 시간 안으로 들어오면 울리고,
// 실시간 정보가 없으면(서울·조회 실패·도착 정보 없음) 예정 출발 시각에 울린다.
export default function AlarmWatcher() {
  const { state, update } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const latest = useRef({ state, pathname: location.pathname })
  const polling = useRef({ reservationId: null, at: 0, busy: false })

  useEffect(() => {
    latest.current = { state, pathname: location.pathname }
  })

  const { alarmSet, plan } = state
  const reservationId = alarmSet && plan ? plan.reservationId : null

  useEffect(() => {
    if (!reservationId) return undefined

    const fire = (kind, path, title, body) => {
      const { state: current, pathname } = latest.current
      update({ alarmFired: { ...current.alarmFired, [kind]: reservationId } })
      notify(current.settings.notifications, title, body)
      if (pathname !== path) navigate(path)
    }

    // 기상 알람: 미뤘으면 미룬 시각에 다시 울리고, 끄지 않은 채 미루기 상한이 되면 안전 알람을 한 번 더 울린다
    const checkWake = (now, current) => {
      const fired = current.alarmFired ?? {}
      const snooze = activeSnooze(current)
      const target = new Date(snooze?.until ?? current.plan.wakeTime).getTime()
      if (fired.wake !== reservationId) {
        if (now >= target && now < target + minutes(GRACE_MIN)) {
          fire('wake', '/alarm/wake', '일어날 시간이에요!', `${current.plan.bus} 타러 갈 준비를 시작하세요.`)
        }
        return
      }
      if (!current.settings.safetyAlarm || fired.dismissed === reservationId || fired.safety === reservationId) return
      const limit = snoozeLimitAt(current.plan, current.settings).getTime()
      if (target < limit && now >= limit && now < limit + minutes(GRACE_MIN)) {
        fire('safety', '/alarm/wake', '아직 알람을 끄지 않았어요', '미루기 상한 시각이에요. 지금 일어나야 버스를 탈 수 있어요.')
      }
    }

    const checkDepart = async (now, current) => {
      if (!current.settings.departNotify || current.alarmFired?.depart === reservationId) return
      const leave = new Date(current.plan.leaveHomeTime).getTime()
      if (now < leave - minutes(LOOKAHEAD_MIN) || now >= leave + minutes(GRACE_MIN)) return

      const detail = current.routeDetail
      const walk = detail?.walkToStop ?? 0
      const buffer = current.settings.bufferMinutes
      const poll = polling.current
      if (poll.reservationId !== reservationId) Object.assign(poll, { reservationId, at: 0 })

      let approach = current.lastApproach?.reservationId === reservationId ? current.lastApproach : null
      if (detail?.approach && !poll.busy && now - poll.at >= POLL_MS) {
        poll.busy = true
        poll.at = now
        try {
          const json = await getBusApproach(detail.approach)
          approach = { ...json, reservationId, receivedAt: new Date().toISOString() }
          update({ lastApproach: approach })
        } catch {
          approach = null
        } finally {
          poll.busy = false
        }
      }

      if (approach?.status === 'FOUND') {
        const arrivals = approach.arrivals.map((a) => ({ ...a, arrivalSeconds: remainingSeconds(a, approach.receivedAt, now) }))
        if (shouldDepart(arrivals, walk, buffer)) {
          const bus = catchableArrival(arrivals, walk)
          fire('depart', '/alarm/depart', '지금 나가야 해요',
            `${bus.routeNo}번이 ${stopsLabel(bus.remainingStops)}, 약 ${Math.ceil(bus.arrivalSeconds / 60)}분 후 도착해요.`)
        }
        return
      }
      if (now >= leave) fire('depart', '/alarm/depart', '지금 나가야 해요', `${current.plan.bus} 탈 시간이에요.`)
    }

    const tick = () => {
      const { state: current } = latest.current
      if (!current.alarmSet || current.plan?.reservationId !== reservationId) return
      const now = Date.now()
      checkWake(now, current)
      checkDepart(now, current)
    }

    tick()
    const timer = setInterval(tick, TICK_MS)
    return () => clearInterval(timer)
  }, [reservationId, navigate, update])

  return null
}
