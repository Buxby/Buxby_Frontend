import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, MapPin, ShieldCheck } from 'lucide-react'
import { Content, Footer, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { Card, IconTile } from '../../components/display'
import { useAppState } from '../../store/context'

const PERMS = [
  { icon: MapPin, title: '위치 (필수)', desc: '출발 감지와 경로 계산에만 써요. 가능한 부분은 기기 안에서 처리해요.' },
  { icon: Bell, title: '알림 (필수)', desc: '기상 알람·출발 알림·버스 지연 알림을 보내요.' },
  { icon: ShieldCheck, title: '안전 알람', desc: '통신이 끊겨도 정해 둔 시각에는 반드시 울려요.' },
]

function requestLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve()
    navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve(), { timeout: 8000 })
  })
}

// A5 위치·알림 권한 안내
export default function PermissionPage() {
  const navigate = useNavigate()
  const { update } = useAppState()
  const [busy, setBusy] = useState(false)

  const allow = async () => {
    setBusy(true)
    try {
      await requestLocation()
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } finally {
      update({ permissionsDone: true })
      navigate('/home', { replace: true })
    }
  }

  return (
    <Screen>
      <Content gap={16} style={{ paddingTop: 32 }}>
        <h1 className="t-title-l">
          버스비를 쓰려면
          <br />두 가지 권한이 필요해요
        </h1>
        <p className="t-body-m c-secondary">알람이 버스 시간에 맞춰 스스로 바뀌려면 위치와 알림이 필요해요.</p>
        {PERMS.map(({ icon, title, desc }) => (
          <Card key={title} className="perm-card">
            <IconTile icon={icon} />
            <div>
              <p className="t-body-l-bold">{title}</p>
              <p className="t-body-s c-secondary">{desc}</p>
            </div>
          </Card>
        ))}
      </Content>
      <Footer>
        <p className="t-caption c-tertiary">더보기 › 권한·알림 설정에서 언제든 바꿀 수 있어요.</p>
        <Button onClick={allow} disabled={busy}>
          {busy ? '권한 요청 중…' : '허용하고 시작하기'}
        </Button>
      </Footer>
    </Screen>
  )
}
