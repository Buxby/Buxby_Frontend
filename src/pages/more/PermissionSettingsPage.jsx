import { useState } from 'react'
import { Content, Screen, TopBar } from '../../components/layout'
import { Card, Divider, Notice, SectionLabel, SettingRow, Toast } from '../../components/display'
import { useAppState } from '../../store/context'
import { useToast } from '../../lib/useToast'

function notificationLabel() {
  if (!('Notification' in window)) return '지원 안 함'
  return { granted: '허용됨', denied: '차단됨', default: '묻기 전' }[Notification.permission]
}

// E3 권한·알림 설정
export default function PermissionSettingsPage() {
  const { state, setSetting } = useAppState()
  const [toast, showToast] = useToast()
  const [notiStatus, setNotiStatus] = useState(notificationLabel)

  const toggleNotifications = async (value) => {
    setSetting('notifications', value)
    if (value && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
      setNotiStatus(notificationLabel())
    }
  }

  return (
    <Screen>
      <TopBar title="권한·알림 설정" />
      <Content gap={12}>
        <SectionLabel>권한</SectionLabel>
        <Card>
          <SettingRow title="위치 접근" description="출발 감지·경로 계산에만 사용해요" value="앱 사용 중" onClick={() => showToast('브라우저 설정에서 위치 권한을 바꿀 수 있어요.')} />
          <Divider />
          <SettingRow title="알림" description={`기상·출발·지연 알림을 받아요 (브라우저: ${notiStatus})`} checked={state.settings.notifications} onToggle={toggleNotifications} />
          <Divider />
          <SettingRow title="정확한 시각 알람" description="버스 상황에 맞춰 알람 시각을 다시 맞춰요" checked={state.settings.exactAlarm} onToggle={(v) => setSetting('exactAlarm', v)} />
        </Card>
        <SectionLabel>개인정보</SectionLabel>
        <Card>
          <SettingRow title="위치정보 이용 동의 내역" value="보기" onClick={() => showToast('동의 내역 화면은 준비 중이에요.')} />
          <Divider />
          <SettingRow title="위치 기록 삭제" description="기기와 서버의 출발 기록을 지워요" value="삭제" onClick={() => showToast('출발 기록 삭제는 백엔드 연동 후 동작해요.')} />
        </Card>
        <Notice>모바일 웹 버전은 버스비를 열어 둔 상태에서 알람이 울려요. 잠금화면 알람은 앱 버전에서 지원할 예정이에요.</Notice>
      </Content>
      <Toast message={toast} />
    </Screen>
  )
}
