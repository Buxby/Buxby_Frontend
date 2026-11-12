import { useNavigate } from 'react-router'
import { BusFront, Lock, Timer } from 'lucide-react'
import { Content, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { IconTile, Toast } from '../../components/display'
import { ALARM, RECOMMEND } from '../../data/mock'
import { addMinutes, alarmView, clock } from '../../lib/time'
import { activeSnooze, nextSnoozeAt, snoozeLimitAt } from '../../lib/snooze'
import { useToast } from '../../lib/useToast'
import { useAppState } from '../../store/context'

// D5 기상 알람 전체화면 (시안③) — 알람 화면에는 광고를 넣지 않음 (중간발표 Q14)
export default function WakeAlarmPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [toast, showToast] = useToast(2800)
  const { plan, settings } = state
  const view = plan ? alarmView(plan) : ALARM
  const snooze = plan ? activeSnooze(state) : null
  const limit = plan ? clock(snoozeLimitAt(plan, settings)) : ALARM.snoozeLimit
  const snoozeAt = plan ? nextSnoozeAt(plan, settings) : addMinutes(new Date(2026, 0, 1, 6, 28), settings.snoozeMinutes)
  const ringTime = plan ? new Date(snooze?.until ?? plan.wakeTime) : null
  const ringingAt = ringTime ? clock(ringTime) : view.wake
  // 홈에서 미리 보기로 연 경우(아직 울릴 시각 전)에는 알람 기록을 건드리지 않는다
  const ringing = Boolean(ringTime) && new Date() >= ringTime

  // 알람을 끄면 미루기 기록을 지우고, 안전 알람이 다시 울리지 않게 표시한다
  const dismiss = () => {
    if (ringing) {
      update({
        wakeOffAt: new Date().toISOString(),
        snooze: null,
        alarmFired: { ...state.alarmFired, wake: plan.reservationId, safety: plan.reservationId, dismissed: plan.reservationId },
      })
    }
    navigate('/alarm/depart')
  }

  const postpone = () => {
    if (!snoozeAt) return
    if (!ringing) {
      const at = plan ? nextSnoozeAt(plan, settings, ringTime) ?? snoozeAt : snoozeAt
      showToast(`누르면 ${clock(at)}에 다시 울려요 · ${limit} 이후로는 미루지 않아요 (미리 보기)`)
      return
    }
    update({
      snooze: { reservationId: plan.reservationId, until: snoozeAt.toISOString(), count: (snooze?.count ?? 0) + 1 },
      // 미룬 시각에 다시 울리도록 기상 알람 기록을 지운다
      alarmFired: { ...state.alarmFired, wake: null },
    })
    navigate('/home', { state: { toast: `${clock(snoozeAt)}에 다시 울려요 · ${limit} 이후로는 미루지 않아요` } })
  }

  return (
    <Screen bg="alarm" className="alarm-screen">
      <Content gap={8} className="alarm-screen__content">
        <Lock size={22} color="var(--icon-inverse)" aria-hidden="true" />
        <p className="t-display-time">{ringingAt}</p>
        <p className="t-body-l">{view.date}</p>
        <div className="spacer" />
        <section className="alarm-card" aria-label="기상 알람">
          <div className="alarm-card__head">
            <IconTile icon={BusFront} tone="solid" />
            <div>
              <p className="t-title-s">일어날 시간이에요!</p>
              <p className="t-body-s c-secondary">버스를 타려면 지금 일어나야 해요.</p>
            </div>
          </div>
          <hr className="alarm-card__rule" />
          <p className="alarm-card__info t-body-s-medium">
            <Timer size={18} color="var(--icon-strong)" /> 출발까지 약 {plan ? plan.preparationMinutes : RECOMMEND.total}분 필요 (평균 준비 시간)
          </p>
          <p className="alarm-card__info t-body-s-medium">
            <BusFront size={18} color="var(--icon-strong)" /> 추천 버스 · {plan ? `${plan.bus} (${view.board} 승차)` : `${RECOMMEND.bus}번 (${ALARM.board} 도착)`}
          </p>
          <Button onClick={dismiss}>알람 끄기</Button>
          <Button variant="tertiary" onClick={postpone} disabled={!snoozeAt}>
            {settings.snoozeMinutes}분 더 자기
          </Button>
          <p className="t-caption c-tertiary" style={{ textAlign: 'center' }}>
            {snoozeAt
              ? `미루기 상한(${limit})까지만 미룰 수 있어요${snooze ? ` · ${snooze.count}번 미룸` : ''}`
              : `미루기 상한(${limit})이 지나 더 미룰 수 없어요`}
          </p>
        </section>
      </Content>
      <Toast message={toast} />
    </Screen>
  )
}
