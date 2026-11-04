import { useNavigate } from 'react-router'
import { BusFront, Lock, Timer } from 'lucide-react'
import { Content, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { IconTile, Toast } from '../../components/display'
import { ALARM, RECOMMEND } from '../../data/mock'
import { useToast } from '../../lib/useToast'
import { useAppState } from '../../store/context'

// D5 기상 알람 전체화면 (시안③) — 알람 화면에는 광고를 넣지 않음 (중간발표 Q14)
export default function WakeAlarmPage() {
  const navigate = useNavigate()
  const { state } = useAppState()
  const [toast, showToast] = useToast(2800)

  return (
    <Screen bg="alarm" className="alarm-screen">
      <Content gap={8} className="alarm-screen__content">
        <Lock size={22} color="var(--icon-inverse)" aria-hidden="true" />
        <p className="t-display-time">{ALARM.wake}</p>
        <p className="t-body-l">{ALARM.date}</p>
        <div className="spacer" />
        <section className="alarm-card" aria-label="기상 알람">
          <div className="alarm-card__head">
            <IconTile icon={BusFront} tone="solid" />
            <div>
              <p className="t-title-s">일어날 시간이에요!</p>
              <p className="t-body-s c-secondary">버스를 타려면 지금 일어나야 해요.</p>
            </div>
          </div>
          <hr className="alarm-card__rule" />
          <p className="alarm-card__info t-body-s-medium">
            <Timer size={18} color="var(--icon-strong)" /> 출발까지 약 {RECOMMEND.total}분 필요 (평균 준비 시간)
          </p>
          <p className="alarm-card__info t-body-s-medium">
            <BusFront size={18} color="var(--icon-strong)" /> 추천 버스 · {RECOMMEND.bus}번 ({ALARM.board} 도착)
          </p>
          <Button onClick={() => navigate('/alarm/depart')}>알람 끄기</Button>
          <Button variant="tertiary" onClick={() => showToast(`6:38에 다시 울려요 · ${state.settings.snoozeLimit} 이후로는 미루지 않아요`)}>
            10분 더 자기
          </Button>
          <p className="t-caption c-tertiary" style={{ textAlign: 'center' }}>
            미루기 상한({state.settings.snoozeLimit.replace('오전 ', '')})까지만 미룰 수 있어요
          </p>
        </section>
      </Content>
      <Toast message={toast} />
    </Screen>
  )
}
