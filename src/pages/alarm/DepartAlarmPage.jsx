import { useNavigate } from 'react-router'
import { DoorOpen } from 'lucide-react'
import { Content, Footer, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { TimeRange } from '../../components/display'
import { RECOMMEND } from '../../data/mock'
import { useAppState } from '../../store/context'

// D6 출발 알람 전체화면 — '출발했어요'로 준비 시간 기록 (중간발표 Q5)
export default function DepartAlarmPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()

  const departed = () => {
    update({ records: state.records + 1 })
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
          {RECOMMEND.bus}번이 12분 후 {RECOMMEND.stop}에 도착해요.
        </p>
        <section className="count-card">
          <div className="count-card__row">
            {[
              ['정류장까지', `도보 ${RECOMMEND.walk}분`, ''],
              ['버스 도착', RECOMMEND.arrivesAt, 'c-brand'],
              ['여유', '4분', 'c-success'],
            ].map(([k, v, c]) => (
              <span key={k}>
                <span className="t-caption c-secondary">{k}</span>
                <strong className={`t-title-s ${c}`}>{v}</strong>
              </span>
            ))}
          </div>
          <TimeRange min={RECOMMEND.min} max={RECOMMEND.max} />
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
          다음 버스(7:23)로 갈게요
        </button>
      </Footer>
    </Screen>
  )
}
