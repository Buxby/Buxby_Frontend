import { useEffect, useRef } from 'react'
import { ackAlarmSync, getAlarmSync } from '../api/alarm'
import { toLocalDateTime } from '../lib/time'
import { useAppState } from '../store/context'

const SYNC_MS = 5 * 60000

const sameTime = (a, b) => new Date(a).getTime() === new Date(b).getTime()

// 서버 예약 상태를 앱 알람에 맞춘다 (/api/alarm-sync).
// - 서버 자동 점검이 출발 직전 버스 상황을 보고 기상·출발 시각을 앞당기면 앱 알람도 바꾼다
// - 서버에서 취소된 예약이면 앱 알람도 끈다
// 바꾼 뒤에는 ack로 '앱에 맞췄음'을 알린다. 서버 연결이 안 되면 기존 알람을 그대로 둔다.
export default function AlarmSync() {
  const { state, update } = useAppState()
  const latest = useRef(state)

  useEffect(() => {
    latest.current = state
  })

  const reservationId = state.alarmSet && state.plan ? state.plan.reservationId : null

  useEffect(() => {
    if (!reservationId) return undefined
    let busy = false
    let stopped = false

    const sync = async () => {
      if (busy || document.visibilityState === 'hidden') return
      busy = true
      try {
        const list = await getAlarmSync()
        const current = latest.current
        if (stopped || !current.alarmSet || current.plan?.reservationId !== reservationId) return
        const item = list.find((a) => a.reservationId === reservationId)
        if (!item) return

        if (item.clientAction === 'CANCEL_ON_DEVICE') {
          update({
            alarmSet: false,
            plan: null,
            snooze: null,
            wakeOffAt: null,
            lastApproach: null,
            syncNotice: '서버에서 취소된 알람이라 이 기기 알람도 껐어요.',
          })
          return
        }
        // VERIFY_DEVICE_ALARM: 이미 맞춘 상태, CHECK_MANUALLY: 서버 처리 실패(기존 알람 유지)
        if (item.clientAction !== 'SCHEDULE_ON_DEVICE') return

        const { plan } = current
        if (!sameTime(item.wakeTime, plan.wakeTime) || !sameTime(item.leaveHomeTime, plan.leaveHomeTime)) {
          const shift = new Date(item.leaveHomeTime) - new Date(plan.leaveHomeTime)
          const earlier = Math.round((new Date(plan.wakeTime) - new Date(item.wakeTime)) / 60000)
          update({
            plan: {
              ...plan,
              wakeTime: item.wakeTime,
              leaveHomeTime: item.leaveHomeTime,
              boardingTime: toLocalDateTime(new Date(new Date(plan.boardingTime).getTime() + shift)),
            },
            snooze: null,
            syncNotice: earlier > 0
              ? `버스 상황이 바뀌어 기상 알람을 ${earlier}분 앞당겼어요.`
              : '서버에서 바뀐 알람 시각으로 다시 맞췄어요.',
          })
        }
        await ackAlarmSync(reservationId, item.wakeTime).catch(() => null)
      } catch {
        // 로그인 만료·서버 오류면 다음 동기화 때 다시 시도한다
      } finally {
        busy = false
      }
    }

    sync()
    const timer = setInterval(sync, SYNC_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reservationId, update])

  return null
}
