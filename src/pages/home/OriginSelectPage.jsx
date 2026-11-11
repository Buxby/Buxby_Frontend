import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { House, LocateFixed } from 'lucide-react'
import { Screen, TopBar } from '../../components/layout'
import { Button, Chip, InputField } from '../../components/controls'
import KakaoMap from '../../components/KakaoMap'
import { ORIGIN_LABELS, PLACES } from '../../data/mock'
import { useAppState } from '../../store/context'
import { useToast } from '../../lib/useToast'
import { addressAt } from '../../lib/kakao'
import { Toast } from '../../components/display'

const LABEL_NAME = { 집: '내 집', 기숙사: '기숙사' }

// 저장된 출발지 이름으로 칩과 직접 입력 값을 되살린다
function initialLabel(name) {
  if (!name || name === '내 집') return ['집', '']
  if (name === '기숙사') return ['기숙사', '']
  return ['직접 입력', name]
}

// B5 출발 위치 선택 (지도 가운데 핀에 맞춘 위치를 출발지로 쓴다)
export default function OriginSelectPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const saved = state.origin ?? PLACES.home
  const [initLabel, initCustom] = initialLabel(state.origin?.name)
  const [label, setLabel] = useState(initLabel)
  const [customName, setCustomName] = useState(initCustom)
  // spot: 지금 핀이 가리키는 위치, target: 지도를 옮길 위치 (처음엔 저장된 출발지, 이후 현재 위치 버튼)
  // target은 옮길 때만 새 객체로 바꾼다 (렌더마다 새로 만들면 지도를 움직일 때마다 되돌아감)
  const [spot, setSpot] = useState({ lat: saved.lat, lng: saved.lng, address: saved.address ?? '' })
  const [target, setTarget] = useState(() => ({ lat: saved.lat, lng: saved.lng }))
  const [toast, showToast] = useToast()
  const lookup = useRef(0)

  // 지도가 멈추면 가운데 좌표를 출발지로 삼고 주소를 찾는다 (늦게 온 이전 응답은 버린다)
  const moveTo = async (lat, lng) => {
    const id = ++lookup.current
    setSpot((s) => ({ ...s, lat, lng }))
    const address = await addressAt(lat, lng)
    if (id === lookup.current) setSpot({ lat, lng, address: address ?? '' })
  }

  const locate = () => {
    if (!navigator.geolocation) return showToast('이 브라우저는 현재 위치를 지원하지 않아요.')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude }
        setTarget(next)
        moveTo(next.lat, next.lng)
        showToast('현재 위치로 이동했어요.')
      },
      () => showToast('위치 권한을 허용해 주세요.'),
      { timeout: 8000, enableHighAccuracy: true },
    )
  }

  const name = label === '직접 입력' ? customName.trim() : LABEL_NAME[label]

  const confirm = () => {
    if (!name) return showToast('출발 위치 이름을 입력해 주세요.')
    // 출발지가 바뀌면 이전 경로는 쓸 수 없다
    update({
      origin: { name, address: spot.address, lat: spot.lat, lng: spot.lng },
      route: null,
      routeDetail: null,
      routeOptions: null,
    })
    navigate('/home')
  }

  return (
    <Screen bg="surface">
      <TopBar title="출발 위치" />
      <KakaoMap height={400} center={target} centerPin onCenterChange={moveTo}>
        <button type="button" className="map-fab" onClick={locate} aria-label="현재 위치로 이동">
          <LocateFixed size={22} color="var(--icon-strong)" />
        </button>
      </KakaoMap>
      <section className="origin-panel">
        <p className="t-body-s c-secondary">지도를 움직여 핀을 출발 위치에 맞춰 주세요</p>
        <div className="origin-panel__place">
          <House size={24} color="var(--icon-brand)" />
          <div>
            <p className="t-body-l-bold">{name || '이름을 입력해 주세요'}</p>
            <p className="t-body-s c-secondary">{spot.address || '주소를 찾는 중이에요'}</p>
          </div>
        </div>
        <div className="chip-row" role="group" aria-label="장소 이름">
          {ORIGIN_LABELS.map((l) => (
            <Chip key={l} selected={label === l} onClick={() => setLabel(l)}>
              {l}
            </Chip>
          ))}
        </div>
        {label === '직접 입력' && (
          <InputField
            label="장소 이름"
            placeholder="예: 학교, 회사"
            value={customName}
            maxLength={20}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}
        <div className="spacer" />
        <Button onClick={confirm}>이 위치로 설정</Button>
      </section>
      <Toast message={toast} />
    </Screen>
  )
}
