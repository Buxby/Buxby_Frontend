import { request } from './client'

function coordinates(origin, destination) {
  return {
    startLongitude: origin.lng,
    startLatitude: origin.lat,
    endLongitude: destination.lng,
    endLatitude: destination.lat,
  }
}

// ODsay 대중교통 경로 검색
export function searchRoutes(origin, destination) {
  return request('/api/routes/search', { query: coordinates(origin, destination) })
}

// 선택한 노선의 서울시 실시간 도착 정보
export function matchBusArrivals(origin, destination, option) {
  const query = { ...coordinates(origin, destination), stationName: option.stop }
  if (option.no) query.busNo = option.no
  return request('/api/seoul/bus/auto-match', { query })
}

// 승차 정류장에 내 노선 버스가 몇 정류장 전·몇 초 후 도착하는지 (TAGO 지역은 TAGO, 서울은 서울시 도착정보)
export function getBusApproach(approach) {
  const { stopId, stopName, stopLat, stopLng, routeIds, busNos } = approach
  return request('/api/bus/approach', {
    query: { stopId, stopName, stopLat, stopLng, routeIds: routeIds.join(','), busNos: busNos.join(',') },
  })
}


/**
 * 선택한 경로에 포함된 버스 노선들의 혼잡도 수집 및 DB 저장
 *
 * @param {string[]} busRouteIds 버스 노선 ID 목록
 */
export function collectBusCongestion(busRouteIds) {

  // 중복 제거 및 빈 값 제거
  const uniqueRouteIds = [
    ...new Set(
      (busRouteIds ?? [])
        .map((id) => String(id).trim())
        .filter(Boolean)
    ),
  ]

  // 버스 노선이 없으면 API 호출하지 않음
  if (uniqueRouteIds.length === 0) {
    return Promise.resolve({
      status: 'SKIPPED',
      requestedCount: 0,
      successCount: 0,
      failedCount: 0,
    })
  }

  // 백엔드 Batch API 호출
  return request('/api/seoul/bus/positions/collect-batch', {
    method: 'POST',

    body: {
      busRouteIds: uniqueRouteIds,
    },
  })
}

