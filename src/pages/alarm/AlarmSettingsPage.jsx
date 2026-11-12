import { useState } from 'react'
import { Content, Screen, TopBar } from '../../components/layout'
import { Card, Divider, SectionLabel, SettingRow } from '../../components/display'
import MinutesSheet from '../../components/MinutesSheet'
import { clockLabel } from '../../lib/time'
import { snoozeLimitAt } from '../../lib/snooze'
import { useAppState } from '../../store/context'

// 바텀시트로 고르는 분 단위 설정
const MINUTE_SETTINGS = {
  snoozeLimitMinutes: {
    title: '미루기 상한',
    description: '처음 알람이 울린 뒤 이 시간까지만 미룰 수 있어요. 집에서 나갈 시각은 넘기지 않아요.',
    presets: [10, 20, 30],
    min: 5,
    max: 120,
  },
  snoozeMinutes: {
    title: '한 번에 미루는 시간',
    description: "기상 알람에서 '더 자기'를 누르면 이 시간 뒤에 다시 울려요.",
    presets: [5, 10, 15],
    min: 1,
    max: 60,
  },
  bufferMinutes: {
    title: '기본 여유 시간',
    description: '최대 소요 시간에 더해 출발·기상 시각을 계산해요. 바꾸면 다음에 알람을 맞출 때부터 반영돼요.',
    presets: [5, 10, 15, 20],
    min: 0,
    max: 60,
  },
}

// D4 알람 설정 — 미루기 상한·기본 여유 시간·안전 알람 (중간발표 Q6·Q7)
export default function AlarmSettingsPage() {
  const { state, setSetting } = useAppState()
  const [editing, setEditing] = useState(null)
  const s = state.settings
  const sheet = editing ? MINUTE_SETTINGS[editing] : null
  const limitTime = state.alarmSet && state.plan ? clockLabel(snoozeLimitAt(state.plan, s)) : null

  return (
    <Screen>
      <TopBar title="알람 설정" />
      <Content gap={12}>
        <SectionLabel>자동 조정</SectionLabel>
        <Card>
          <SettingRow title="버스 따라 알람 자동 조정" description="버스가 늦으면 알람도 미뤄져요" checked={s.autoAdjust} onToggle={(v) => setSetting('autoAdjust', v)} />
          <Divider />
          <SettingRow
            title="미루기 상한"
            description={limitTime ? `${limitTime}까지 미룰 수 있어요` : '처음 알람 후 이 시간까지만 미룰 수 있어요'}
            value={`${s.snoozeLimitMinutes}분`}
            onClick={() => setEditing('snoozeLimitMinutes')}
          />
          <Divider />
          <SettingRow title="한 번에 미루는 시간" description="'더 자기'를 누르면 이 시간 뒤에 다시 울려요" value={`${s.snoozeMinutes}분`} onClick={() => setEditing('snoozeMinutes')} />
          <Divider />
          <SettingRow title="기본 여유 시간" description="최대 소요 시간에 더해 계산해요" value={`${s.bufferMinutes}분`} onClick={() => setEditing('bufferMinutes')} />
        </Card>
        <SectionLabel>안전</SectionLabel>
        <Card>
          <SettingRow title="안전 알람" description="알람을 끄지 않으면 미루기 상한 시각에 한 번 더 울려요" checked={s.safetyAlarm} onToggle={(v) => setSetting('safetyAlarm', v)} />
        </Card>
        <SectionLabel>알림</SectionLabel>
        <Card>
          <SettingRow title="출발 알림" description="나가야 할 때 알려드려요" checked={s.departNotify} onToggle={(v) => setSetting('departNotify', v)} />
          <Divider />
          <SettingRow title="지연·대안 경로 알림" description="버스가 늦거나 놓쳤을 때 대안을 알려드려요" checked={s.delayNotify} onToggle={(v) => setSetting('delayNotify', v)} />
        </Card>
      </Content>
      <MinutesSheet
        open={!!sheet}
        title={sheet?.title}
        description={sheet?.description}
        presets={sheet?.presets ?? []}
        value={editing ? s[editing] : 0}
        min={sheet?.min ?? 0}
        max={sheet?.max ?? 0}
        onClose={() => setEditing(null)}
        onConfirm={(minutes) => {
          setSetting(editing, minutes)
          setEditing(null)
        }}
      />
    </Screen>
  )
}
