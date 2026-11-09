import { useState } from 'react'
import { useNavigate } from 'react-router'
import { House, LocateFixed } from 'lucide-react'
import { Screen, TopBar } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import KakaoMap from '../../components/KakaoMap'
import { ORIGIN_LABELS, PLACES } from '../../data/mock'
import { useAppState } from '../../store/context'
import { useToast } from '../../lib/useToast'
import { Toast } from '../../components/display'

// B5 출발 위치 선택 (지도)
export default function OriginSelectPage() {
  const navigate = useNavigate()
  const { update } = useAppState()
  const [label, setLabel] = useState('집')
  const [located, setLocated] = useState(null)
  const [toast, showToast] = useToast()
  const place = located ? { ...PLACES.home, ...located, address: '현재 위치' } : PLACES.home

  const locate = () => {
    if (!navigator.geolocation) return showToast('이 브라우저는 현재 위치를 지원하지 않아요.')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocated({ lat: coords.latitude, lng: coords.longitude })
        showToast('현재 위치를 찾았어요.')
      },
      () => showToast('위치 권한을 허용해 주세요.'),
      { timeout: 8000 },
    )
  }

  const confirm = () => {
    const name = label === '집' ? '내 집' : label
    // 출발지가 바뀌면 이전 경로는 쓸 수 없다
    update({ origin: { ...place, name }, route: null, routeDetail: null, routeOptions: null })
    navigate('/home')
  }

  return (
    <Screen bg="surface">
      <TopBar title="출발 위치" />
      <KakaoMap
        key={located ? `${located.lat},${located.lng}` : 'home'}
        height={400}
        markers={[
          { type: 'home', ...place, x: 50, y: 44 },
          ...(located ? [] : [{ type: 'current', lat: 37.4861, lng: 126.9001, x: 63, y: 62 }]),
        ]}
      >
        <button type="button" className="map-fab" onClick={locate} aria-label="현재 위치로 이동">
          <LocateFixed size={22} color="var(--icon-strong)" />
        </button>
      </KakaoMap>
      <section className="origin-panel">
        <p className="t-body-s c-secondary">지도를 움직여 위치를 맞춰 주세요</p>
        <div className="origin-panel__place">
          <House size={24} color="var(--icon-brand)" />
          <div>
            <p className="t-body-l-bold">{label === '집' ? '내 집' : label}</p>
            <p className="t-body-s c-secondary">{located ? place.address : `${place.address} (도로명 주소)`}</p>
          </div>
        </div>
        <div className="chip-row" role="group" aria-label="장소 이름">
          {ORIGIN_LABELS.map((l) => (
            <Chip key={l} selected={label === l} onClick={() => setLabel(l)}>
              {l}
            </Chip>
          ))}
        </div>
        <div className="spacer" />
        <Button onClick={confirm}>이 위치로 설정</Button>
      </section>
      <Toast message={toast} />
    </Screen>
  )
}
