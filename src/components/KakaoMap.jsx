import { useEffect, useRef, useState } from 'react'
import { BusFront, Flag, House } from 'lucide-react'
import { hasKakaoKey, loadKakaoMaps } from '../lib/kakao'

const MARKER_ICON = { home: House, bus: BusFront, destination: Flag }
const MARKER_SVG = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  bus: '<path d="M4 6 2 7"/><path d="M10 6h4"/><path d="m22 7-2-1"/><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 21v-2"/>',
  destination: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
}
const MARKER_ICON_SIZE = { home: 20, bus: 16, destination: 18 }

function markerElement(type) {
  const el = document.createElement('span')
  el.className = `marker marker--${type}`
  const svg = MARKER_SVG[type]
  if (svg) {
    const s = MARKER_ICON_SIZE[type]
    el.innerHTML = `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`
  }
  return el
}

function Marker({ type }) {
  const MarkerIcon = MARKER_ICON[type]
  return <span className={`marker marker--${type}`}>{MarkerIcon && <MarkerIcon size={MARKER_ICON_SIZE[type]} />}</span>
}

function Callout({ title, sub }) {
  return (
    <span className="map-callout">
      <strong className="t-title-s">{title}</strong>
      {sub && <span className="t-caption c-secondary">{sub}</span>}
    </span>
  )
}

// 키가 없거나 SDK를 못 불러올 때 쓰는 지도 그림 (피그마 MapBase와 같음)
function FallbackMap({ height, markers, callout, labels, route }) {
  return (
    <>
      <svg className="map__fallback" viewBox={`0 0 390 ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="390" height={height} fill="#ECEFF3" />
        <path d={`M262 0C276 70 336 110 326 ${height * 0.6}C318 ${height * 0.8} 352 ${height * 0.92} 390 ${height}V0Z`} fill="#CFE2F6" />
        <rect x="24" y={height * 0.1} width="78" height="56" rx="8" fill="#DCEFD8" />
        <rect x="150" y={height * 0.74} width="84" height="62" rx="8" fill="#DCEFD8" />
        <path d={`M0 ${height * 0.4}L390 ${height * 0.33}`} stroke="#fff" strokeWidth="12" />
        <path d={`M0 ${height * 0.7}L390 ${height * 0.8}`} stroke="#fff" strokeWidth="9" />
        <path d={`M118 0L142 ${height}`} stroke="#fff" strokeWidth="12" />
        <path d={`M224 0L206 ${height}`} stroke="#fff" strokeWidth="7" />
        <path d={`M0 60L118 52M142 ${height * 0.56}L390 ${height * 0.53}M30 0L50 ${height}M300 110L290 ${height}`} stroke="#fff" strokeWidth="4" />
        {route && (
          <>
            <path d={`M58 ${height * 0.55} L126 ${height * 0.6}`} stroke="#9AA1AE" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
            <path
              d={`M126 ${height * 0.6} C 170 ${height * 0.78}, 210 ${height * 0.62}, 236 ${height * 0.58} S 300 ${height * 0.5}, 334 ${height * 0.42}`}
              stroke="var(--icon-brand)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </svg>
      <div className="map__overlay">
        {markers.map((m) => (
          <span key={m.type} style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}>
            <Marker type={m.type} />
          </span>
        ))}
        {callout && (
          <span style={{ position: 'absolute', left: `${callout.x}%`, top: `${callout.y}%`, transform: 'translate(-50%, -50%)' }}>
            <Callout title={callout.title} sub={callout.sub} />
          </span>
        )}
        {labels?.map((l) => (
          <span key={l.text} className="map-label t-caption-medium" style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%, -50%)' }}>
            {l.text}
          </span>
        ))}
      </div>
    </>
  )
}

/**
 * 카카오 지도.
 * markers: [{ type: 'home'|'bus'|'destination'|'current', lat, lng, x, y }]  (x, y는 지도 그림용 % 위치)
 * route:   [[lat, lng], ...] 버스 구간,  walk: [[lat, lng], ...] 도보 구간
 * center:  { lat, lng } 바뀌면 지도를 그 위치로 옮긴다 (마커가 없으면 처음 중심으로도 씀)
 * centerPin: 지도 가운데에 고정 핀을 보여준다 (위치 고르기용)
 * onCenterChange(lat, lng): 지도를 움직이고 멈출 때마다 가운데 좌표를 알려준다
 */
export default function KakaoMap({ height = 236, markers = [], route, walk, callout, labels, center, centerPin, onCenterChange, children }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const onCenterChangeRef = useRef(onCenterChange)
  const [mode, setMode] = useState(hasKakaoKey() ? 'loading' : 'fallback')

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange
  }, [onCenterChange])

  // 현재 위치 버튼 등으로 center가 바뀌면 지도를 옮긴다
  useEffect(() => {
    const map = mapRef.current
    if (!map || !center || mode !== 'kakao') return
    map.panTo(new window.kakao.maps.LatLng(center.lat, center.lng))
  }, [center, mode])

  useEffect(() => {
    if (!hasKakaoKey()) return undefined
    let cancelled = false
    const overlays = []

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return
        const points = markers.map((m) => new kakao.maps.LatLng(m.lat, m.lng))
        const start = points[0] ?? (center ? new kakao.maps.LatLng(center.lat, center.lng) : new kakao.maps.LatLng(37.4852, 126.9013))
        const map = new kakao.maps.Map(containerRef.current, { center: start, level: centerPin ? 3 : 5 })
        mapRef.current = map
        kakao.maps.event.addListener(map, 'idle', () => {
          const c = map.getCenter()
          onCenterChangeRef.current?.(c.getLat(), c.getLng())
        })
        // 처음 그릴 때는 idle이 오지 않을 수 있어 시작 위치를 한 번 알려준다
        onCenterChangeRef.current?.(start.getLat(), start.getLng())
        markers.forEach((m, i) => {
          overlays.push(new kakao.maps.CustomOverlay({ map, position: points[i], content: markerElement(m.type), yAnchor: 0.5 }))
        })
        if (walk) overlays.push(new kakao.maps.Polyline({ map, path: walk.map(([a, b]) => new kakao.maps.LatLng(a, b)), strokeWeight: 4, strokeColor: '#9AA1AE', strokeStyle: 'shortdash' }))
        if (route) overlays.push(new kakao.maps.Polyline({ map, path: route.map(([a, b]) => new kakao.maps.LatLng(a, b)), strokeWeight: 6, strokeColor: '#4A6CF7' }))
        if (callout && callout.lat) {
          const el = document.createElement('span')
          el.className = 'map-callout'
          el.innerHTML = `<strong class="t-title-s">${callout.title}</strong><span class="t-caption c-secondary">${callout.sub ?? ''}</span>`
          overlays.push(new kakao.maps.CustomOverlay({ map, position: new kakao.maps.LatLng(callout.lat, callout.lng), content: el, yAnchor: 1.4 }))
        }
        if (points.length > 1) {
          const bounds = new kakao.maps.LatLngBounds()
          points.forEach((p) => bounds.extend(p))
          map.setBounds(bounds, 40, 40, 40, 40)
        }
        setMode('kakao')
      })
      .catch(() => {
        if (!cancelled) setMode('fallback')
      })

    return () => {
      cancelled = true
      mapRef.current = null
      overlays.forEach((o) => o.setMap(null))
    }
    // 지도는 처음 한 번만 그린다 (예시 데이터 고정)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="map" style={{ height }}>
      {mode !== 'fallback' && <div ref={containerRef} className="map__canvas" />}
      {mode === 'fallback' && <FallbackMap height={height} markers={markers} callout={callout} labels={labels} route={!!route} />}
      {mode === 'fallback' && <span className="map__badge t-caption c-secondary" title="VITE_KAKAO_MAP_KEY를 설정하면 실제 카카오맵이 보여요">지도 미리보기</span>}
      {centerPin && (
        <span className="map__center-pin" aria-hidden="true">
          <Marker type="home" />
        </span>
      )}
      {children}
    </div>
  )
}
