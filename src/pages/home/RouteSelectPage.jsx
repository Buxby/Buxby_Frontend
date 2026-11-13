import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, BusFront, Check, RefreshCw } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, IconTile, Notice } from '../../components/display'
import {
  searchRoutes,
  collectBusCongestion,
  getSubwayArrivals,
} from '../../api/transit'
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
  // 버스 혼잡도 수집 중 여부
  const [collecting, setCollecting] = useState(false)

  
  useEffect(() => {
    if (!live) return undefined

    let cancelled = false

    searchRoutes(origin, destination)
      .then((json) => {
        if (cancelled) return

        const all = toRouteOptions(
          json,
          origin.name,
          destination.name
        )

        setOptions(all.filter((o) => o.no))
        update({ routeOptions: all })

        // 버스 구간 추출 결과 확인
        console.table(
          all.flatMap((option) =>
            (option.busSegments ?? []).map((segment) => ({
              경로: option.name,
              구간순서: segment.sectionIndex + 1,
              버스번호: segment.busNos.join(', '),
              노선ID: segment.busRouteIds.join(', '),
              승차정류장: segment.boardingStationName,
              하차정류장: segment.alightingStationName,
            }))
          )
        )

        // 경로별 버스 노선 ID 확인
        console.log(
          '[경로별 전체 버스 노선 ID]',
          all.map((option) => ({
            name: option.name,
            busRouteIds: option.busRouteIds,
          }))
        )

        // 지하철 구간 추출 결과 확인
        console.table(
          all.flatMap((option) =>
            (option.subwaySegments ?? []).map((segment) => ({
              경로: option.name,
              구간순서: segment.sectionIndex + 1,
              노선: segment.lineNames.join(', '),
              승차역: segment.boardingStationName,
              하차역: segment.alightingStationName,
              이동시간: segment.sectionTime,
              정거장수: segment.stationCount,
              전체역목록: segment.stationNames.join(' → '),
            }))
          )
        )

        // 경로별 지하철 승차역 확인
        console.log(
          '[경로별 전체 지하철 승차역]',
          all.map((option) => ({
            name: option.name,
            subwayStationNames: option.subwayStationNames,
            allSubwayLines: option.allSubwayLines,
          }))
        )
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
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

  
  
  const confirm = async () => {
    if (!selected || collecting) return

    setCollecting(true)

    let congestionState = null
    let subwayArrivalState = null

    // =====================================
    // 1. 버스 노선 ID 추출
    // =====================================

    const busRouteIds = live
      ? [
          ...new Set(
            (selected.busRouteIds ?? [])
              .filter(Boolean)
              .map((id) => String(id).trim())
          ),
        ]
      : []

    // =====================================
    // 2. 지하철 승차역 추출
    // =====================================

    const subwayStationNames = live
      ? [
          ...new Set(
            (selected.subwayStationNames ?? [])
              .map((name) => String(name).trim())
              .filter(Boolean)
          ),
        ]
      : []

    // =====================================
    // 3. 버스 혼잡도 수집
    // =====================================

    try {
      if (busRouteIds.length > 0) {
        const response = await collectBusCongestion(busRouteIds)

        congestionState = {
          status: response.status,
          requestedCount: response.requestedCount,
          successCount: response.successCount,
          noDataCount: response.noDataCount ?? 0,
          failedCount: response.failedCount,
          collectedAt: new Date().toISOString(),

          routes: (response.results ?? []).map((route) => ({
            busRouteId: route.busRouteId,
            status: route.status,
            fetchedCount: route.fetchedCount ?? 0,
            savedCount: route.savedCount ?? 0,
            collectedAt: route.collectedAt ?? null,
            vehicles: route.vehicles ?? [],
            message: route.message ?? null,
          })),
        }

        console.log('[혼잡도 수집 결과]', congestionState)
      }
    } catch (err) {
      console.warn('[혼잡도 수집 실패]', err.message)

      congestionState = {
        status: 'REQUEST_FAILED',
        message: err.message,
        routes: [],
      }
    }

    // =====================================
    // 4. 지하철 실시간 도착정보 조회
    // =====================================

    try {
      if (subwayStationNames.length > 0) {

        // 각 승차역의 도착정보를 개별 조회
        const stationResults = await Promise.all(
          subwayStationNames.map(async (stationName) => {

            try {
              const response = await getSubwayArrivals(stationName)

              return {
                stationName,
                status: response.status ?? 'UNKNOWN',
                count: response.count ?? response.arrivals?.length ?? 0,
                fetchedAt: response.fetchedAt ?? null,
                arrivals: response.arrivals ?? [],
                message: null,
              }

            } catch (err) {
              console.warn(
                `[지하철 도착정보 조회 실패: ${stationName}]`,
                err.message
              )

              return {
                stationName,
                status: 'REQUEST_FAILED',
                count: 0,
                fetchedAt: null,
                arrivals: [],
                message: err.message,
              }
            }
          })
        )

        // 역별 조회 결과 집계
        const successCount = stationResults.filter(
          (station) => station.status === 'SUCCESS'
        ).length

        const noDataCount = stationResults.filter(
          (station) => station.status === 'NO_DATA'
        ).length

        const failedCount = stationResults.filter(
          (station) => station.status === 'REQUEST_FAILED'
        ).length

        let status = 'SUCCESS'

        if (failedCount > 0) {
          status = successCount > 0 || noDataCount > 0
            ? 'PARTIAL_SUCCESS'
            : 'REQUEST_FAILED'
        } else if (successCount === 0) {
          status = 'NO_DATA'
        }

        subwayArrivalState = {
          status,
          requestedCount: subwayStationNames.length,
          successCount,
          noDataCount,
          failedCount,
          collectedAt: new Date().toISOString(),

          stations: stationResults,
        }

        console.log(
          '[지하철 실시간 도착정보]',
          subwayArrivalState
        )
      }
    } catch (err) {
      console.warn('[지하철 정보 처리 실패]', err.message)

      subwayArrivalState = {
        status: 'REQUEST_FAILED',
        requestedCount: subwayStationNames.length,
        successCount: 0,
        noDataCount: 0,
        failedCount: subwayStationNames.length,
        collectedAt: new Date().toISOString(),
        stations: [],
      }
    }

    // =====================================
    // 5. 경로 및 실시간 정보 저장
    // =====================================

    update({
      route: selected.no,
      routeDetail: live ? selected : null,

      // 기존 버스 정보
      busCongestion: congestionState,

      // 신규 지하철 정보
      subwayArrivals: subwayArrivalState,
    })

    console.log('[선택 경로]', selected.name)
    console.log('[저장된 버스 혼잡도]', congestionState)
    console.log('[저장된 지하철 도착정보]', subwayArrivalState)

    setCollecting(false)
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
        <Button
          disabled={!selected || collecting}
          onClick={confirm}
        >
          {collecting
            ? '교통정보 확인 중...'
            : selected
              ? `${selected.name}으로 설정`
              : '노선을 선택하세요'}
        </Button>
      </Footer>
    </Screen>
  )
}
