import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { BusFront, CircleAlert, MapPin, RefreshCw, TrainFront } from 'lucide-react'
import { BottomNav, Content, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { AlertBanner, Badge, Card, IconTile, Notice } from '../../components/display'
import { reportMissedBus, rerouteMissedBus } from '../../api/alarm'
import { currentPosition } from '../../lib/geolocation'
import { clockLabel } from '../../lib/time'
import { useAppState } from '../../store/context'

const ROUTE_TYPES = {
  BUS: { label: '버스', icon: BusFront },
  SUBWAY: { label: '지하철', icon: TrainFront },
  BUS_AND_SUBWAY: { label: '버스+지하철', icon: BusFront },
  TRANSIT: { label: '대중교통', icon: BusFront },
}

// 서버 오류를 화면 안내로 바꾼다
function describeError(err) {
  if (err.status === 401) return { kind: 'login', message: '로그인하면 대체 경로를 찾아드려요.' }
  if (err.status === 404) return { kind: 'noAlarm', message: '서버에서 이 알람 예약을 찾지 못했어요. 알람을 다시 맞춰 주세요.' }
  if (err.status === 409) {
    return { kind: 'noPath', message: '이 알람에는 경로 정보가 없어 대체 경로를 찾을 수 없어요. 알람을 다시 맞추면 쓸 수 있어요.' }
  }
  return { kind: 'other', message: err.message }
}

// 놓친 기록 → 위치 확인(또는 출발 위치) → 대체 경로 검색
async function findAlternatives(reservationId, { reportFirst, origin, onReported, onSearching }) {
  if (reportFirst) {
    try {
      await reportMissedBus(reservationId)
    } catch (err) {
      throw Object.assign(err, { reportFailed: true })
    }
    onReported()
  }
  let position
  try {
    position = origin ? { lat: origin.lat, lng: origin.lng } : await currentPosition()
  } catch (err) {
    throw Object.assign(new Error(err.message), { kind: 'location' })
  }
  onSearching()
  return rerouteMissedBus(reservationId, position)
}

function OptionCard({ option }) {
  const type = ROUTE_TYPES[option.routeType] ?? ROUTE_TYPES.TRANSIT
  const arrival = option.estimatedArrivalTime ? clockLabel(new Date(option.estimatedArrivalTime)) : null
  return (
    <Card padded className="missed-option">
      <div className="card-head">
        <IconTile icon={type.icon} size={36} iconSize={20} />
        <span className="t-body-l-bold">약 {option.travelMinutes}분</span>
        <span className="spacer" />
        {option.late
          ? <Badge tone="danger">{option.lateMinutes}분 늦음</Badge>
          : <Badge tone="success">제때 도착</Badge>}
      </div>
      <p className="t-body-s">{option.summary || type.label}</p>
      {arrival && <p className="t-caption c-secondary">{arrival} 도착 예상 · {type.label}</p>}
    </Card>
  )
}

// 버스를 놓쳤을 때: 놓친 기록을 남기고(여유 시간 학습) 현재 위치에서 목적지까지 대체 경로를 찾는다
export default function MissedBusPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const { plan, origin } = state
  const reservationId = state.alarmSet && plan ? plan.reservationId : null
  const [phase, setPhase] = useState('locating') // locating | searching | ready | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const reported = useRef(state.missedReportedFor)

  const [attempt, setAttempt] = useState({ n: 0, useOrigin: false })

  useEffect(() => {
    if (!reservationId) return undefined
    let cancelled = false
    // 같은 예약을 여러 번 '놓침'으로 기록하지 않는다 (먼저 표시하고, 실패하면 되돌린다)
    const reportFirst = reported.current !== reservationId
    if (reportFirst) reported.current = reservationId

    findAlternatives(reservationId, {
      reportFirst,
      origin: attempt.useOrigin ? origin : null,
      onReported: () => update({ missedReportedFor: reservationId }),
      onSearching: () => !cancelled && setPhase('searching'),
    })
      .then((res) => {
        if (cancelled) return
        setResult(res)
        setPhase('ready')
      })
      .catch((err) => {
        if (err.reportFailed) reported.current = null
        if (cancelled) return
        setError(err.kind === 'location' ? { kind: 'location', message: err.message } : describeError(err))
        setPhase('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt, reservationId, origin, update])

  // 다시 찾기 (새로고침·다시 시도·출발 위치 기준)
  const search = (useOrigin = false) => {
    setError(null)
    setPhase(useOrigin ? 'searching' : 'locating')
    setAttempt((a) => ({ n: a.n + 1, useOrigin }))
  }

  if (!reservationId) {
    return (
      <Screen>
        <TopBar title="버스를 놓쳤어요" />
        <Content gap={12} style={{ paddingTop: 16 }}>
          <Card padded className="error-card">
            <IconTile icon={BusFront} size={56} iconSize={28} />
            <p className="t-title-s">맞춰 둔 알람이 없어요</p>
            <p className="t-body-s c-secondary">알람을 맞춘 일정이 있어야 목적지까지 대체 경로를 찾을 수 있어요.</p>
            <Button variant="secondary" size="m" onClick={() => navigate('/home')}>
              홈으로
            </Button>
          </Card>
        </Content>
        <BottomNav />
      </Screen>
    )
  }

  const options = result?.options ?? []
  const deadline = result?.desiredArrivalTime ? clockLabel(new Date(result.desiredArrivalTime)) : null

  return (
    <Screen>
      <TopBar title="버스를 놓쳤어요" action={phase === 'ready' ? { label: '새로고침', onClick: () => search() } : undefined} />
      <Content gap={12} style={{ paddingTop: 4, paddingBottom: 16 }}>
        {(phase === 'locating' || phase === 'searching') && (
          <p className="loading-line t-body-s c-secondary" role="status">
            <RefreshCw size={18} color="var(--icon-brand)" className="spin" />
            {phase === 'locating' ? '현재 위치를 확인하는 중이에요' : '대체 경로를 찾는 중이에요'}
          </p>
        )}

        {phase === 'error' && error && (
          <Card padded className="error-card">
            <IconTile icon={CircleAlert} size={56} iconSize={28} tone="danger" />
            <p className="t-body-m">{error.message}</p>
            {error.kind === 'login' && (
              <Button variant="secondary" size="m" onClick={() => navigate('/login')}>
                로그인
              </Button>
            )}
            {error.kind === 'location' && origin && (
              <Button variant="secondary" size="m" onClick={() => search(true)}>
                <MapPin size={16} /> 출발 위치({origin.name}) 기준으로 찾기
              </Button>
            )}
            {(error.kind === 'location' || error.kind === 'other') && (
              <Button variant="tertiary" size="m" onClick={() => search()}>
                다시 시도
              </Button>
            )}
          </Card>
        )}

        {phase === 'ready' && result && (
          <>
            <AlertBanner tone="info" title={`${result.destination}까지 가는 다른 방법`}>
              {deadline ? `도착 희망 ${deadline} 기준이에요. 놓친 기록은 다음 알람의 여유 시간 계산에 반영돼요.` : result.message}
            </AlertBanner>
            {options.length === 0
              ? <Notice tone="neutral">{result.message || '지금 위치에서 갈 수 있는 경로를 찾지 못했어요.'}</Notice>
              : options.map((option) => <OptionCard key={option.optionNumber} option={option} />)}
            <Notice>경로 상세와 실시간 도착 정보는 지도 앱에서 확인해 주세요.</Notice>
          </>
        )}
      </Content>
      <BottomNav />
    </Screen>
  )
}
