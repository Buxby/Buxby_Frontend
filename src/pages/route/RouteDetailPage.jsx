import { useNavigate } from 'react-router'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, RouteStep } from '../../components/display'
import { RECOMMEND, ROUTE_STEPS } from '../../data/mock'

// C2 노선 상세 (타임라인)
export default function RouteDetailPage() {
  const navigate = useNavigate()
  return (
    <Screen bg="surface">
      <TopBar title="경로 상세" />
      <Content gap={16}>
        <section className="route-summary">
          <p className="route-summary__top">
            <span className="t-body-l-bold">{RECOMMEND.bus}번 이용</span>
            <Badge tone="brand">추천</Badge>
          </p>
          <p className="t-title-m c-brand">
            최소 {RECOMMEND.min}분 ~ 최대 {RECOMMEND.max}분
          </p>
          <p className="t-body-s c-secondary">오전 7:00 출발 → 7:28 ~ 7:41 도착 · 환승 없음</p>
        </section>
        <ol className="timeline">
          {ROUTE_STEPS.map((s, i) => (
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
