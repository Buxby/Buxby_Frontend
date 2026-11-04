import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BusFront, ChevronRight, CircleAlert, CircleDot, RefreshCw } from 'lucide-react'
import { BottomNav, Content, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { AdBanner, Badge, Card, IconTile, Notice, TimeRange } from '../../components/display'
import KakaoMap from '../../components/KakaoMap'
import { ALARM, PLACES, RECOMMEND } from '../../data/mock'

const ROUTE_PATH = [
  [PLACES.stop.lat, PLACES.stop.lng],
  [37.4905, 126.8902],
  [37.4968, 126.8768],
  [PLACES.destination.lat, PLACES.destination.lng],
]

export function BusNow({ sub = RECOMMEND.sub, right = `${RECOMMEND.arrivesIn}분 후`, rightSub = `(${RECOMMEND.arrivesAt})`, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className="bus-now" onClick={onClick}>
      <IconTile icon={BusFront} />
      <span className="bus-now__text">
        <span className="t-title-s">{RECOMMEND.bus}번</span>
        <span className="t-body-s c-secondary">{sub}</span>
      </span>
      <span className="bus-now__right">
        <span className="t-title-s c-brand">{right}</span>
        <span className="t-caption c-secondary">{rightSub}</span>
      </span>
    </Tag>
  )
}

function Skeleton({ w, h = 14 }) {
  return <span className="skeleton" style={{ width: w, height: h }} />
}

// C1 추천 경로 · C4 불러오는 중 · C5 불러오기 실패
export default function RecommendRoutePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const forced = params.get('state')
  const [status, setStatus] = useState(forced === 'error' ? 'error' : 'loading')
  const [attempt, setAttempt] = useState(0)

  // 실시간 버스 도착 정보 요청 자리 (노선 API 연동 전까지 예시 데이터)
  // ?state=loading | error 로 들어오면 첫 화면을 그 상태로 고정 (검수용)
  useEffect(() => {
    if (attempt === 0 && forced) return undefined
    const timer = setTimeout(() => setStatus('ready'), 700)
    return () => clearTimeout(timer)
  }, [attempt, forced])

  const load = () => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  const refresh = status === 'loading' ? undefined : { label: '새로고침', onClick: load }

  return (
    <Screen>
      <TopBar title="추천 경로" action={refresh} backTo="/home" />
      {status === 'ready' && (
        <KakaoMap
          height={190}
          markers={[
            { type: 'home', ...PLACES.home, x: 13, y: 55 },
            { type: 'bus', ...PLACES.stop, x: 32, y: 60 },
            { type: 'destination', ...PLACES.destination, x: 85.5, y: 42 },
          ]}
          walk={[
            [PLACES.home.lat, PLACES.home.lng],
            [PLACES.stop.lat, PLACES.stop.lng],
          ]}
          route={ROUTE_PATH}
          callout={{ title: `약 ${RECOMMEND.total}분`, sub: `(도보 ${RECOMMEND.walk}분 포함)`, x: 50, y: 26, lat: 37.4935, lng: 126.884 }}
          labels={[{ text: PLACES.destination.name, x: 80, y: 66 }]}
        />
      )}
      {status === 'loading' && <div className="map-skeleton" aria-hidden="true" />}

      {status === 'ready' && (
        <Content gap={12} style={{ paddingTop: 16, paddingBottom: 16 }}>
          <Card padded>
            <div className="card-head">
              <span className="t-body-l-bold">추천 경로</span>
              <Badge tone="success">실시간</Badge>
              <span className="spacer" />
              <Link to="/route/detail" className="more-link t-body-s c-secondary">
                상세보기 <ChevronRight size={16} />
              </Link>
            </div>
            <BusNow onClick={() => navigate('/route/delay')} />
            <p className="stop-line t-body-s c-secondary">
              <CircleDot size={16} color="var(--icon-brand)" />
              {RECOMMEND.stop} · 도보 {RECOMMEND.walk}분
            </p>
          </Card>
          <div className="two-col">
            {RECOMMEND.next.map((n) => (
              <Card key={n.label} padded className="next-card">
                <span className="t-body-s-medium">{n.label}</span>
                <span className="t-caption c-secondary">
                  {n.in}분 후 · {n.at}
                </span>
              </Card>
            ))}
          </div>
          <TimeRange min={RECOMMEND.min} max={RECOMMEND.max} />
          <AdBanner />
        </Content>
      )}

      {status === 'loading' && (
        <Content gap={12} style={{ paddingTop: 16 }}>
          <Card padded>
            <Skeleton w={120} h={18} />
            <Skeleton w={260} />
            <Skeleton w={200} />
          </Card>
          <div className="two-col">
            {[0, 1].map((i) => (
              <Card key={i} padded className="next-card">
                <Skeleton w={70} h={12} />
                <Skeleton w={110} h={12} />
              </Card>
            ))}
          </div>
          <p className="loading-line t-body-s c-secondary" role="status">
            <RefreshCw size={18} color="var(--icon-brand)" className="spin" />
            실시간 버스 정보를 불러오는 중이에요
          </p>
        </Content>
      )}

      {status === 'error' && (
        <Content gap={12} style={{ paddingTop: 16 }}>
          <Card padded className="error-card">
            <IconTile icon={CircleAlert} size={56} iconSize={28} tone="danger" />
            <p className="t-title-s">버스 정보를 불러오지 못했어요</p>
            <p className="t-body-s c-secondary">
              공공데이터 버스 도착 정보 응답이 늦어지고 있어요.
              <br />
              마지막으로 받은 정보로 알람을 유지하고 있어요.
            </p>
            <Button variant="secondary" size="m" onClick={load}>
              다시 시도
            </Button>
          </Card>
          <Card padded>
            <div className="card-head">
              <span className="t-body-l-bold">마지막 정보</span>
              <Badge tone="neutral">{RECOMMEND.updatedAt} 기준</Badge>
            </div>
            <BusNow sub={RECOMMEND.stop} rightSub={`(${RECOMMEND.arrivesAt} 예정)`} />
          </Card>
          <Notice>안전 알람 {ALARM.snoozeLimit}는 통신과 관계없이 그대로 울려요.</Notice>
          <div className="spacer" />
          <AdBanner />
        </Content>
      )}
      <BottomNav />
    </Screen>
  )
}
