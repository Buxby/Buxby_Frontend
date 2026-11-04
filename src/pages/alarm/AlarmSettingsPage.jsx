import { Content, Screen, TopBar } from '../../components/layout'
import { Card, Divider, SectionLabel, SettingRow } from '../../components/display'
import { useAppState } from '../../store/context'

const SNOOZE_LIMITS = ['오전 6:35', '오전 6:45', '오전 6:55']
const BUFFERS = [5, 10, 15, 20]
const next = (list, value) => list[(list.indexOf(value) + 1) % list.length]

// D4 알람 설정 — 미루기 상한·기본 여유 시간·안전 알람 (중간발표 Q6·Q7)
export default function AlarmSettingsPage() {
  const { state, setSetting } = useAppState()
  const s = state.settings
  return (
    <Screen>
      <TopBar title="알람 설정" />
      <Content gap={12}>
        <SectionLabel>자동 조정</SectionLabel>
        <Card>
          <SettingRow title="버스 따라 알람 자동 조정" description="버스가 늦으면 알람도 미뤄져요" checked={s.autoAdjust} onToggle={(v) => setSetting('autoAdjust', v)} />
          <Divider />
          <SettingRow title="미루기 상한" description="이 시각 이후로는 미루지 않아요" value={s.snoozeLimit} onClick={() => setSetting('snoozeLimit', next(SNOOZE_LIMITS, s.snoozeLimit))} />
          <Divider />
          <SettingRow title="기본 여유 시간" description="최대 소요 시간에 더해 계산해요" value={`${s.bufferMinutes}분`} onClick={() => setSetting('bufferMinutes', next(BUFFERS, s.bufferMinutes))} />
        </Card>
        <SectionLabel>안전</SectionLabel>
        <Card>
          <SettingRow title="안전 알람" description="통신이 끊겨도 미루기 상한 시각에 반드시 울려요" checked={s.safetyAlarm} onToggle={(v) => setSetting('safetyAlarm', v)} />
        </Card>
        <SectionLabel>알림</SectionLabel>
        <Card>
          <SettingRow title="출발 알림" description="나가야 할 때 알려드려요" checked={s.departNotify} onToggle={(v) => setSetting('departNotify', v)} />
          <Divider />
          <SettingRow title="지연·대안 경로 알림" description="버스가 늦거나 놓쳤을 때 대안을 알려드려요" checked={s.delayNotify} onToggle={(v) => setSetting('delayNotify', v)} />
        </Card>
      </Content>
    </Screen>
  )
}
