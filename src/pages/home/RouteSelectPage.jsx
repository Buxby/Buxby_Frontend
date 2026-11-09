import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, BusFront, Check, RefreshCw } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, IconTile, Notice } from '../../components/display'
import { searchRoutes } from '../../api/transit'
import { toRouteOptions } from '../../lib/routes'
import { ROUTE_OPTIONS } from '../../data/mock'
import { formatArrival, useAppState } from '../../store/context'

const PREVIEW_OPTIONS = ROUTE_OPTIONS.map((r) => ({ ...r, id: r.no, name: `${r.no}번`, walkToStop: r.walk }))

// B7 이용 노선 선택 (출발지·목적지가 있으면 ODsay 검색 결과, 없으면 검수용 예시)
export default function RouteSelectPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const { origin, destination } = state
  const live = Boolean(origin && destination)
  const [options, setOptions] = useState(live ? null : PREVIEW_OPTIONS)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [picked, setPicked] = useState(state.routeDetail?.id ?? null)

  useEffect(() => {
    if (!live) return undefined
    let cancelled = false
    searchRoutes(origin, destination)
      .then((json) => {
        if (cancelled) return
        const all = toRouteOptions(json, origin.name, destination.name)
        setOptions(all.filter((o) => o.no))
        update({ routeOptions: all })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [live, origin, destination, attempt, update])

  const retry = () => {
    setError('')
    setOptions(null)
    setAttempt((n) => n + 1)
  }

  const selected = options?.find((o) => o.id === picked) ?? options?.find((o) => o.recommended) ?? options?.[0]

  const confirm = () => {
    update({ route: selected.no, routeDetail: live ? selected : null })
    navigate('/home')
  }

  return (
    <Screen>
      <TopBar title="이용 노선" />
      <Content gap={12}>
        <p className="t-body-m c-secondary">
          {origin?.name ?? '내 집'} → {destination?.name ?? '동양미래대학교'}
          <br />
          {state.arrival ? formatArrival(state.arrival) : '오전 9:00'} 도착 기준으로 추천해요
        </p>
        {error && (
          <>
            <Notice>{error}</Notice>
            <Button variant="secondary" size="m" onClick={retry}>
              다시 시도
            </Button>
          </>
        )}
        {!error && !options && (
          <p className="loading-line t-body-s c-secondary" role="status">
            <RefreshCw size={18} color="var(--icon-brand)" className="spin" />
            경로를 찾는 중이에요
          </p>
        )}
        {options?.length === 0 && <Notice>버스로 갈 수 있는 경로를 찾지 못했어요. 출발 위치나 목적지를 바꿔 보세요.</Notice>}
        {options?.map((r) => {
          const on = selected?.id === r.id
          return (
            <button key={r.id} type="button" className={`option-card ${on ? 'option-card--on' : ''}`} aria-pressed={on} onClick={() => setPicked(r.id)}>
              <span className="option-card__top">
                <IconTile icon={BusFront} size={32} iconSize={18} tone={on ? 'solid' : 'brand'} />
                <span className="t-body-l-bold">{r.name}</span>
                <span className="t-caption c-secondary">{r.type}</span>
                {r.recommended && <Badge tone="brand">추천</Badge>}
                <span className="spacer" />
                {on && <Check size={20} color="var(--icon-brand)" />}
              </span>
              <span className="t-body-s c-secondary">
                {r.stop} · 도보 {r.walkToStop}분{r.transfer ? ` · ${r.transfer}` : ''}
              </span>
              <span className="option-card__range">
                {r.max == null ? (
                  <span className="t-body-s-medium">약 {r.min}분</span>
                ) : (
                  <>
                    <span className="t-body-s-medium">최소 {r.min}분</span>
                    <ArrowRight size={14} color="var(--icon-default)" aria-hidden="true" />
                    <span className="t-body-s-medium">최대 {r.max}분</span>
                  </>
                )}
                {r.headway != null && <span className="t-body-s c-secondary">· 배차 {r.headway}분</span>}
              </span>
            </button>
          )
        })}
      </Content>
      <Footer>
        <Button disabled={!selected} onClick={confirm}>
          {selected ? `${selected.name}으로 설정` : '노선을 선택하세요'}
        </Button>
      </Footer>
    </Screen>
  )
}
