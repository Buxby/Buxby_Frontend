import { useNavigate } from 'react-router'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, RouteStep } from '../../components/display'
import { RECOMMEND, ROUTE_STEPS } from '../../data/mock'
import { alarmView } from '../../lib/time'
import { useAppState } from '../../store/context'

// C2 노선 상세 (타임라인)
export default function RouteDetailPage() {
  const navigate = useNavigate()
  const { state } = useAppState()
  const detail = state.routeDetail
  const view = state.plan ? alarmView(state.plan) : null
  const steps = detail?.steps ?? ROUTE_STEPS
  return (
    <Screen bg="surface">
      <TopBar title="경로 상세" />
      <Content gap={16}>
        <section className="route-summary">
          <p className="route-summary__top">
            <span className="t-body-l-bold">{detail ? detail.name : `${RECOMMEND.bus}번`} 이용</span>
            {(!detail || detail.recommended) && <Badge tone="brand">추천</Badge>}
          </p>
          <p className="t-title-m c-brand">{detail ? `약 ${detail.total}분` : `최소 ${RECOMMEND.min}분 ~ 최대 ${RECOMMEND.max}분`}</p>
          <p className="t-body-s c-secondary">
            {!detail && '오전 7:00 출발 → 7:28 ~ 7:41 도착 · 환승 없음'}
            {detail && (view ? `${view.depart} 출발 → ${view.arrive} 도착 · ${detail.transfer}` : detail.transfer)}
          </p>
        </section>
        <ol className="timeline">
          {steps.map((s, i) => (
            <RouteStep key={i} {...s} />
          ))}
        </ol>
      </Content>
      <Footer>
        <div className="two-col">
          <Button variant="secondary" onClick={() => navigate('/route')}>
            지도 보기
          </Button>
          <Button variant="tertiary" onClick={() => navigate('/route/options')}>
            다른 경로
          </Button>
        </div>
      </Footer>
    </Screen>
  )
}
