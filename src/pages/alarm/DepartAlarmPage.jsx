import { useNavigate } from 'react-router'
import { DoorOpen } from 'lucide-react'
import { Content, Footer, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { TimeRange } from '../../components/display'
import { RECOMMEND } from '../../data/mock'
import { recordPreparation } from '../../api/alarm'
import { clockLabel, prepMinutesSince } from '../../lib/time'
import { useAppState } from '../../store/context'

const PREVIEW = {
  bus: `${RECOMMEND.bus}번`,
  minutes: 12,
  stop: RECOMMEND.stop,
  walk: RECOMMEND.walk,
  arrivesAt: RECOMMEND.arrivesAt,
  spare: 4,
  min: RECOMMEND.min,
  max: RECOMMEND.max,
  nextLabel: '다음 버스(7:23)로 갈게요',
}

function liveInfo(plan, detail) {
  const boarding = new Date(plan.boardingTime)
  const minutes = Math.max(0, Math.ceil((boarding.getTime() - new Date().getTime()) / 60000))
  return {
    bus: plan.bus,
    minutes,
    stop: detail.stop,
    walk: detail.walkToStop,
    arrivesAt: clockLabel(boarding),
    spare: Math.max(0, minutes - detail.walkToStop),
    min: detail.min,
    max: detail.max,
    nextLabel: '다음 버스로 갈게요',
  }
}

// D6 출발 알람 전체화면 — '출발했어요'로 준비 시간 기록 (중간발표 Q5)
export default function DepartAlarmPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const { plan, routeDetail } = state
  const info = plan && routeDetail ? liveInfo(plan, routeDetail) : PREVIEW

  const departed = async () => {
    const minutes = plan ? prepMinutesSince(state.wakeOffAt) : null
    if (minutes) {
      // 기록 실패가 출발 안내를 막으면 안 되므로 다음 화면으로 그대로 이동한다
      await recordPreparation({ minutes }).catch(() => {})
    }
    if (plan) update({ wakeOffAt: null })
    navigate('/route')
  }

  return (
    <Screen bg="brand">
      <Content gap={12} style={{ paddingTop: 48 }}>
        <span className="depart-pill t-caption-medium">
          <DoorOpen size={16} /> 출발 알림
        </span>
        <h1 className="t-display-l">지금 나가야 해요</h1>
        <p className="t-body-l">
          {info.bus}이 {info.minutes}분 후 {info.stop}에 도착해요.
        </p>
        <section className="count-card">
          <div className="count-card__row">
            {[
              ['정류장까지', `도보 ${info.walk}분`, ''],
              ['버스 도착', info.arrivesAt, 'c-brand'],
              ['여유', `${info.spare}분`, 'c-success'],
            ].map(([k, v, c]) => (
              <span key={k}>
                <span className="t-caption c-secondary">{k}</span>
                <strong className={`t-title-s ${c}`}>{v}</strong>
              </span>
            ))}
          </div>
          <TimeRange min={info.min} max={info.max} />
        </section>
      </Content>
      <Footer>
        <Button variant="secondary" onClick={departed}>
          출발했어요
        </Button>
        <p className="t-caption" style={{ textAlign: 'center' }}>
          누르면 오늘 준비 시간 기록에 반영돼요
        </p>
        <button type="button" className="t-body-s-medium underline-link" onClick={() => navigate('/route')}>
          {info.nextLabel}
        </button>
      </Footer>
    </Screen>
  )
}
