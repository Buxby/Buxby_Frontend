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

// 승차 정류장에 내 노선 버스가 몇 정류장 전·몇 초 후 도착하는지 (TAGO, 서울 제외)
export function getBusApproach(approach) {
  const { stopId, stopName, stopLat, stopLng, routeIds, busNos } = approach
  return request('/api/bus/approach', {
    query: { stopId, stopName, stopLat, stopLng, routeIds: routeIds.join(','), busNos: busNos.join(',') },
  })
}
