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
  return request('/api/seoul/bus/auto-match', {
    query: { ...coordinates(origin, destination), busNo: option.no, stationName: option.stop },
  })
}
