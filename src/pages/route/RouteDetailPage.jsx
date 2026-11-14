
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, RouteStep } from '../../components/display'
import { RECOMMEND, ROUTE_STEPS } from '../../data/mock'
import { alarmView } from '../../lib/time'
import { useAppState } from '../../store/context'
import { getSubwayArrivals } from '../../api/transit'

// 혼잡도별 표시 색상
function getCongestionStyle(label) {

  switch (label) {

    case '여유':
      return {
        background: '#DCFCE7',
        color: '#15803D',
      }

    case '보통':
      return {
        background: '#FEF3C7',
        color: '#B45309',
      }

    case '혼잡':
      return {
        background: '#FFEDD5',
        color: '#C2410C',
      }

    case '매우혼잡':
    case '매우 혼잡':
      return {
        background: '#FEE2E2',
        color: '#B91C1C',
      }

    default:
      return {
        background: '#F1F5F9',
        color: '#475569',
      }
  }
}

// 수집 시각 표시
function formatCollectedAt(value) {

  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ODsay 노선명과 서울시 API 노선명 비교를 위한 정규화
function normalizeSubwayLineName(value) {
  return String(value ?? '')
    .replace(/^수도권\s*/, '')
    .replace(/\s+/g, '')
    .trim()
}

// 선택한 경로에 해당하는 지하철 열차만 필터링
function filterSubwayArrivals(arrivals, lineNames) {

  const targetLines = (lineNames ?? [])
    .map(normalizeSubwayLineName)
    .filter(Boolean)

  if (targetLines.length === 0) {
    return arrivals
  }

  return arrivals.filter((train) => {

    const actualLine = normalizeSubwayLineName(
      train.lineName
    )

    if (!actualLine) return false

    return targetLines.some((targetLine) =>
      actualLine === targetLine
      || actualLine.includes(targetLine)
      || targetLine.includes(actualLine)
    )
  })
}

// 차량별 혼잡도
function CongestionVehicle({ vehicle }) {

  const label = vehicle.congestionLabel
    || vehicle.congestion
    || '정보없음'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div>
        <div className="t-body-s-medium">
          {vehicle.vehicleNumber || '차량번호 미확인'}
        </div>

        <div className="t-caption c-secondary">
          {vehicle.nextStopId
            ? `다음 정류장 ID: ${vehicle.nextStopId}`
            : '위치 정보 확인 중'}
        </div>
      </div>

      <span
        style={{
          ...getCongestionStyle(label),
          padding: '5px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  )
}


// 노선별 혼잡도 표시
function BusCongestionSection({ congestion, detail }) {

  const busSegments = detail?.busSegments ?? []
  const routes = congestion?.routes ?? []

  if (busSegments.length === 0) {
    return null
  }

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <h3 className="t-body-l-bold">
          실시간 버스 혼잡도
        </h3>

        <p className="t-caption c-secondary">
          선택한 경로에 포함된 버스의 차량별 정보예요.
        </p>
      </div>

      {!congestion && (
        <p className="t-body-s c-secondary">
          아직 혼잡도 정보를 조회하지 않았어요.
        </p>
      )}

      {congestion?.status === 'REQUEST_FAILED' && (
        <p className="t-body-s c-secondary">
          혼잡도 정보를 가져오지 못했어요.
          경로 이용에는 문제가 없어요.
        </p>
      )}

      {routes.map((route) => {

        const segment = busSegments.find(
          (item) =>
            (item.busRouteIds ?? []).includes(route.busRouteId)
        )

        const busName =
          segment?.busNos?.join(', ')
          || segment?.busNo
          || '버스'

        const vehicles = route.vehicles ?? []

        const counts = {
          여유: 0,
          보통: 0,
          혼잡: 0,
          매우혼잡: 0,
        }

        vehicles.forEach((vehicle) => {

          const label =
            vehicle.congestionLabel
            || vehicle.congestion

          if (label === '여유') counts.여유++
          else if (label === '보통') counts.보통++
          else if (label === '혼잡') counts.혼잡++
          else if (
            label === '매우혼잡'
            || label === '매우 혼잡'
          ) counts.매우혼잡++
        })

        const collectedTime =
          formatCollectedAt(route.collectedAt)
          || formatCollectedAt(congestion.collectedAt)

        return (
          <div
            key={route.busRouteId}
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid #E5E7EB',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <strong className="t-body-m-bold">
                {busName}번 버스
              </strong>

              <span className="t-caption c-secondary">
                {vehicles.length}대 조회
              </span>
            </div>

            {route.status === 'NO_DATA' && (
              <p className="t-body-s c-secondary">
                현재 운행 중인 차량 정보가 없습니다.
              </p>
            )}

            {route.status === 'FAILED' && (
              <p className="t-body-s c-secondary">
                이 노선의 혼잡도 정보를 가져오지 못했어요.
              </p>
            )}

            {route.status === 'SUCCESS' && vehicles.length === 0 && (
              <p className="t-body-s c-secondary">
                표시할 차량 정보가 없습니다.
              </p>
            )}

            {vehicles.length > 0 && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  {Object.entries(counts).map(([label, count]) => (
                    <div
                      key={label}
                      style={{
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        padding: '9px 3px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '19px',
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        {label === '매우혼잡' ? '매우 혼잡' : label}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  {vehicles.map((vehicle, index) => (
                    <CongestionVehicle
                      key={vehicle.vehicleId || index}
                      vehicle={vehicle}
                    />
                  ))}
                </div>
              </>
            )}

            {collectedTime && (
              <p
                className="t-caption c-secondary"
                style={{ marginTop: '10px', textAlign: 'right' }}
              >
                수집 시각: {collectedTime}
              </p>
            )}

          </div>
        )
      })}

    </section>
  )
}


// =====================================
// 지하철 실시간 도착정보 표시
// =====================================

function SubwayArrivalSection({
  subwayArrivals,
  detail,
  onRefresh,
  refreshing,
}) {

  const subwaySegments = detail?.subwaySegments ?? []

  if (subwaySegments.length === 0) {
    return null
  }

  const stationNames = [
    ...new Set(
      (detail?.subwayStationNames ?? []).filter(Boolean)
    ),
  ]

  const stations = subwayArrivals?.stations ?? []

  const stationMap = new Map(
    stations.map((station) => [
      station.stationName,
      station,
    ])
  )

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}
      >
        <h3 className="t-body-l-bold">
          실시간 지하철 도착정보
        </h3>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '7px 10px',
            background: refreshing ? '#F1F5F9' : '#FFFFFF',
            color: '#475569',
            fontSize: '12px',
            fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          {refreshing ? '조회 중...' : '새로고침'}
        </button>
      </div>

      <p className="t-caption c-secondary">
        선택한 경로에 포함된 노선의 열차만 표시해요.
      </p>

      <p
        className="t-caption c-secondary"
        style={{ marginTop: '5px' }}
      >
        자동 갱신: 3분마다
      </p>

      {!subwayArrivals && (
        <p className="t-body-s c-secondary" style={{ marginTop: '14px' }}>
          아직 지하철 도착정보를 조회하지 않았어요.
        </p>
      )}

      {stationNames.map((stationName) => {

        const station = stationMap.get(stationName)

        // 해당 승차역에서 이용할 지하철 구간
        const matchingSegments = subwaySegments.filter(
          (segment) =>
            segment.boardingStationName === stationName
        )

        // 해당 승차역에서 이용할 노선명
        const lineNames = [
          ...new Set(
            matchingSegments.flatMap(
              (segment) => segment.lineNames ?? []
            )
          ),
        ]

        // API 응답에서 경로에 해당하는 열차만 필터링
        const rawArrivals = station?.arrivals ?? []

        const arrivals = filterSubwayArrivals(
          rawArrivals,
          lineNames
        )

        return (
          <div
            key={stationName}
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid #E5E7EB',
            }}
          >
            {/* 승차역 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              <div>
                <strong className="t-body-m-bold">
                  {stationName}
                </strong>

                <div className="t-caption c-secondary">
                  {lineNames.join(' · ')}
                </div>
              </div>

              <span className="t-caption c-secondary">
                {arrivals.length}개 열차
              </span>
            </div>

            {/* 조회 실패 */}
            {station?.status === 'REQUEST_FAILED' && (
              <p className="t-body-s c-secondary">
                지하철 도착정보를 가져오지 못했어요.
                잠시 후 다시 시도해 주세요.
              </p>
            )}

            {/* 데이터 없음 */}
            {station?.status === 'NO_DATA' && (
              <p className="t-body-s c-secondary">
                현재 운행 중인 열차 정보가 없습니다.
              </p>
            )}

            {/* 노선에 해당하는 열차 없음 */}
            {station?.status === 'SUCCESS'
              && rawArrivals.length > 0
              && arrivals.length === 0 && (
                <p className="t-body-s c-secondary">
                  현재 해당 노선의 도착정보가 없습니다.
                </p>
              )}

            {/* 열차별 도착정보 */}
            {arrivals.map((train, index) => (

              <div
                key={`${train.trainNumber || 'train'}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 10px',
                  marginTop: '8px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>

                  <div className="t-body-s-medium">
                    {train.lineName}
                    {' · '}
                    {train.updnLine || ''}
                  </div>

                  <div className="t-caption c-secondary">
                    {train.trainLineNm
                      || `${train.destinationStation || '행'}`}
                  </div>

                  {train.arrivalDetailMessage && (
                    <div className="t-caption c-secondary">
                      현재 위치: {train.arrivalDetailMessage}
                    </div>
                  )}

                  {train.arrivalCodeLabel && (
                    <div className="t-caption c-secondary">
                      {train.arrivalCodeLabel}
                    </div>
                  )}

                </div>

                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                    maxWidth: '120px',
                  }}
                >
                  <strong
                    style={{
                      fontSize: '14px',
                      color: '#2563EB',
                    }}
                  >
                    {train.arrivalMessage || '도착 정보 확인 중'}
                  </strong>

                  {train.isLastTrain === '1' && (
                    <div className="t-caption c-secondary">
                      막차
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 해당 역의 데이터가 없는 경우 */}
            {!station && subwayArrivals && (
              <p className="t-body-s c-secondary">
                아직 이 역의 조회 결과가 없습니다.
              </p>
            )}

            {/* 조회 시각 */}
            {station?.fetchedAt && (
              <p
                className="t-caption c-secondary"
                style={{
                  marginTop: '8px',
                  textAlign: 'right',
                }}
              >
                조회 시각: {formatCollectedAt(station.fetchedAt)}
              </p>
            )}

          </div>
        )
      })}

      {subwayArrivals?.status === 'PARTIAL_SUCCESS' && (
        <p
          className="t-caption c-secondary"
          style={{ marginTop: '12px' }}
        >
          일부 역의 도착정보만 정상적으로 조회되었어요.
        </p>
      )}

      {subwayArrivals?.status === 'REQUEST_FAILED' && (
        <p
          className="t-caption c-secondary"
          style={{ marginTop: '12px' }}
        >
          교통정보 서버에 연결할 수 없습니다.
        </p>
      )}

    </section>
  )
}


// C2 노선 상세 (타임라인)
export default function RouteDetailPage() {

  const navigate = useNavigate()

  const { state, update } = useAppState()

  const detail = state.routeDetail

  // 지하철 도착정보 갱신 상태
  const [refreshingSubway, setRefreshingSubway] = useState(false)

  // 중복 API 호출 방지
  const refreshingRef = useRef(false)

  // 선택한 경로에 포함된 지하철 승차역
  const subwayStationNames = useMemo(() => (
    [
      ...new Set(
        (detail?.subwayStationNames ?? [])
          .map((name) => String(name).trim())
          .filter(Boolean)
      ),
    ]
  ), [detail?.subwayStationNames])

  // =====================================
  // 지하철 도착정보 다시 조회
  // =====================================

  const refreshSubwayArrivals = useCallback(async () => {

    if (
      subwayStationNames.length === 0
      || refreshingRef.current
    ) {
      return
    }

    refreshingRef.current = true
    setRefreshingSubway(true)

    try {

      // 승차역별 도착정보 조회
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
              `[지하철 갱신 실패: ${stationName}]`,
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

      // 조회 결과 집계
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

        status =
          successCount > 0 || noDataCount > 0
            ? 'PARTIAL_SUCCESS'
            : 'REQUEST_FAILED'

      } else if (successCount === 0) {

        status = 'NO_DATA'
      }

      const result = {
        status,
        requestedCount: subwayStationNames.length,
        successCount,
        noDataCount,
        failedCount,
        collectedAt: new Date().toISOString(),
        stations: stationResults,
      }

      update({
        subwayArrivals: result,
      })

      console.log('[지하철 도착정보 갱신]', result)

    } finally {

      refreshingRef.current = false
      setRefreshingSubway(false)
    }

  }, [subwayStationNames, update])

  // =====================================
  // 3분마다 지하철 도착정보 자동 갱신
  // =====================================

  useEffect(() => {

    if (subwayStationNames.length === 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      refreshSubwayArrivals()
    }, 180000)

    return () => {
      window.clearInterval(intervalId)
    }

  }, [refreshSubwayArrivals, subwayStationNames.length])

  const view = state.plan
    ? alarmView(state.plan)
    : null

  const steps = detail?.steps ?? ROUTE_STEPS

  return (
    <Screen bg="surface">

      <TopBar title="경로 상세" />

      <Content gap={16}>

        <section className="route-summary">

          <p className="route-summary__top">

            <span className="t-body-l-bold">
              {detail ? detail.name : `${RECOMMEND.bus}번`} 이용
            </span>

            {(!detail || detail.recommended) && (
              <Badge tone="brand">추천</Badge>
            )}

          </p>

          <p className="t-title-m c-brand">
            {detail
              ? `약 ${detail.total}분`
              : `최소 ${RECOMMEND.min}분 ~ 최대 ${RECOMMEND.max}분`}
          </p>

          <p className="t-body-s c-secondary">

            {!detail &&
              '오전 7:00 출발 → 7:28 ~ 7:41 도착 · 환승 없음'}

            {detail &&
              (view
                ? `${view.depart} 출발 → ${view.arrive} 도착 · ${detail.transfer}`
                : detail.transfer)}

          </p>

        </section>

        {/* 기존 경로 타임라인 */}
        <ol className="timeline">
          {steps.map((s, i) => (
            <RouteStep key={i} {...s} />
          ))}
        </ol>

        {/* 신규: 실시간 버스 혼잡도 */}
        <BusCongestionSection
          congestion={state.busCongestion}
          detail={detail}
        />
        {/* 신규: 실시간 지하철 도착정보 */}
        <SubwayArrivalSection
          subwayArrivals={state.subwayArrivals}
          detail={detail}
          onRefresh={refreshSubwayArrivals}
          refreshing={refreshingSubway}
        />

      </Content>

      <Footer>

        <div className="two-col">

          <Button
            variant="secondary"
            onClick={() => navigate('/route')}
          >
            지도 보기
          </Button>

          <Button
            variant="tertiary"
            onClick={() => navigate('/route/options')}
          >
            다른 경로
          </Button>

        </div>

      </Footer>

    </Screen>
  )
}
