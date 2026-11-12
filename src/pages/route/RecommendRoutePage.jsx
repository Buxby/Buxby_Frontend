import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BusFront, ChevronRight, CircleAlert, CircleDot, RefreshCw } from 'lucide-react'
import { BottomNav, Content, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { AdBanner, Badge, Card, IconTile, Notice, TimeRange } from '../../components/display'
import KakaoMap from '../../components/KakaoMap'
import { ALARM, PLACES, RECOMMEND, RECOMMEND_SOON, URGENT_MINUTES } from '../../data/mock'
import { loadRealtime } from '../../lib/busApproach'
import { snoozeLimitAt } from '../../lib/snooze'
import { clockLabel } from '../../lib/time'
import { useAppState } from '../../store/context'

const ROUTE_PATH = [
  [PLACES.stop.lat, PLACES.stop.lng],
  [37.4905, 126.8902],
  [37.4968, 126.8768],
  [PLACES.destination.lat, PLACES.destination.lng],
]

// 버스 도착까지 URGENT_MINUTES(5분) 이하면 도착 시간을 빨간색으로 표시 (C6)
export function BusNow({ data = RECOMMEND, sub = data.sub, atSuffix = '', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  const hasTime = data.arrivesIn != null
  const urgent = hasTime ? data.arrivesIn <= URGENT_MINUTES : data.arrivalText === '곧 도착'
  return (
    <Tag type={onClick ? 'button' : undefined} className="bus-now" onClick={onClick}>
      <IconTile icon={BusFront} />
      <span className="bus-now__text">
        <span className="t-title-s">{data.bus}번</span>
        <span className="t-body-s c-secondary">{sub}</span>
      </span>
      <span className="bus-now__right">
        <span className={`t-title-s ${urgent ? 'c-danger' : 'c-brand'}`}>
          {urgent && hasTime && <span className="sr-only">곧 도착, </span>}
          {hasTime ? `${data.arrivesIn}분 후` : data.arrivalText}
        </span>
        {hasTime && (
          <span className={`t-caption ${urgent ? 'c-danger' : 'c-secondary'}`}>
            ({data.arrivesAt}
            {atSuffix})
          </span>
        )}
      </span>
    </Tag>
  )
}

function Skeleton({ w, h = 14 }) {
  return <span className="skeleton" style={{ width: w, height: h }} />
}

// C1 추천 경로 · C4 불러오는 중 · C5 불러오기 실패 · C6 곧 도착(5분 이하)
// ?state=preview | loading | error | soon 은 예시 데이터로 보는 검수용
export default function RecommendRoutePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state, update } = useAppState()
  const forced = params.get('state')
  const { origin, destination, routeDetail: detail } = state
  const live = !forced && Boolean(detail && origin && destination)
  const [status, setStatus] = useState(forced === 'error' ? 'error' : 'loading')
  const [attempt, setAttempt] = useState(0)
  const [realtime, setRealtime] = useState(null)

  useEffect(() => {
    if (live) {
      let cancelled = false
      loadRealtime(origin, destination, detail)
        .then((next) => {
          if (cancelled) return
          setRealtime(next)
          if (next) update({ lastRealtime: next })
          setStatus('ready')
        })
        .catch(() => {
          if (!cancelled) setStatus('error')
        })
      return () => {
        cancelled = true
      }
    }
    // ?state=loading | error 로 들어오면 첫 화면을 그 상태로 고정 (검수용)
    if (attempt === 0 && (forced === 'loading' || forced === 'error')) return undefined
    const timer = setTimeout(() => setStatus('ready'), 700)
    return () => clearTimeout(timer)
  }, [attempt, forced, live, origin, destination, detail, update])

  const load = () => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  if (!forced && !live) {
    return (
      <Screen>
        <TopBar title="추천 경로" backTo="/home" />
        <Content gap={12} style={{ paddingTop: 16 }}>
          <Card padded className="error-card">
            <IconTile icon={BusFront} size={56} iconSize={28} />
            <p className="t-title-s">아직 설정한 경로가 없어요</p>
            <p className="t-body-s c-secondary">목적지와 출발 위치, 이용 노선을 먼저 정해 주세요.</p>
            <Button variant="secondary" size="m" onClick={() => navigate('/home')}>
              일정 설정하기
            </Button>
          </Card>
        </Content>
        <BottomNav />
      </Screen>
    )
  }

  const preview = forced === 'soon' ? { ...RECOMMEND, ...RECOMMEND_SOON } : RECOMMEND
  const data = live
    ? {
        bus: detail.no,
        sub: detail.stop,
        arrivesIn: null,
        arrivalText: '도착 정보 없음',
        stop: detail.stop,
        walk: detail.walkToStop,
        next: [],
        ...realtime,
        total: detail.total,
        min: detail.min,
        max: detail.max,
        totalWalk: detail.walk,
      }
    : { ...preview, totalWalk: preview.walk }
  const home = live ? origin : PLACES.home
  const stop = live ? { lat: detail.stopLat, lng: detail.stopLng } : PLACES.stop
  const goal = live ? destination : PLACES.destination
  const lastInfo = live ? state.lastRealtime : RECOMMEND
  const refresh = status === 'loading' ? undefined : { label: '새로고침', onClick: load }

  return (
    <Screen>
      <TopBar title="추천 경로" action={refresh} backTo="/home" />
      {status === 'ready' && (
        <KakaoMap
          height={190}
          markers={[
            { type: 'home', ...home, x: 13, y: 55 },
            { type: 'bus', ...stop, x: 32, y: 60 },
            { type: 'destination', ...goal, x: 85.5, y: 42 },
          ]}
          walk={[
            [home.lat, home.lng],
            [stop.lat, stop.lng],
          ]}
          route={live ? detail.path : ROUTE_PATH}
          callout={{ title: `약 ${data.total}분`, sub: `(도보 ${data.totalWalk}분 포함)`, x: 50, y: 26, lat: (home.lat + goal.lat) / 2, lng: (home.lng + goal.lng) / 2 }}
          labels={[{ text: goal.name, x: 80, y: 66 }]}
        />
      )}
      {status === 'loading' && <div className="map-skeleton" aria-hidden="true" />}

      {status === 'ready' && (
        <Content gap={12} style={{ paddingTop: 16, paddingBottom: 16 }}>
          <Card padded>
            <div className="card-head">
              <span className="t-body-l-bold">추천 경로</span>
              {live && !realtime ? <Badge tone="neutral">실시간 정보 없음</Badge> : <Badge tone="success">실시간</Badge>}
              <span className="spacer" />
              <Link to="/route/detail" className="more-link t-body-s c-secondary">
                상세보기 <ChevronRight size={16} />
              </Link>
            </div>
            {/* 지연 정보 API가 아직 없어 실제 경로에서는 지연 안내(예시)로 보내지 않는다 */}
            <BusNow data={data} onClick={live ? undefined : () => navigate('/route/delay')} />
            <p className="stop-line t-body-s c-secondary">
              <CircleDot size={16} color="var(--icon-brand)" />
              {data.stop} · 도보 {data.walk}분
            </p>
          </Card>
          <div className="two-col">
            {data.next.map((n) => (
              <Card key={n.label} padded className="next-card">
                <span className="t-body-s-medium">{n.label}</span>
                <span className="t-caption c-secondary">{n.in != null ? `${n.in}분 후 · ${n.at}` : n.text}</span>
              </Card>
            ))}
          </div>
          <TimeRange min={data.min} max={data.max} />
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
          {lastInfo && (
            <Card padded>
              <div className="card-head">
                <span className="t-body-l-bold">마지막 정보</span>
                <Badge tone="neutral">{lastInfo.updatedAt} 기준</Badge>
              </div>
              <BusNow data={lastInfo} sub={lastInfo.stop} atSuffix=" 예정" />
            </Card>
          )}
          <Notice>안전 알람 {live && state.plan ? clockLabel(snoozeLimitAt(state.plan, state.settings)) : `오전 ${ALARM.snoozeLimit}`}는 통신과 관계없이 그대로 울려요.</Notice>
          <div className="spacer" />
          <AdBanner />
        </Content>
      )}
      <BottomNav />
    </Screen>
  )
}
