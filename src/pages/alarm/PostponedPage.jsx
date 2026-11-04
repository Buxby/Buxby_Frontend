import { useNavigate } from 'react-router'
import { Lock, Route } from 'lucide-react'
import { Content, Screen } from '../../components/layout'
import { NotificationCard } from '../../components/display'
import { ALARM, DELAY } from '../../data/mock'

// D7 알람 자동 연기 · 푸시 알림 (잠금화면 예시)
export default function PostponedPage() {
  const navigate = useNavigate()
  return (
    <Screen bg="alarm" className="alarm-screen">
      <Content gap={8} className="alarm-screen__content">
        <Lock size={22} color="var(--icon-inverse)" aria-hidden="true" />
        <p className="t-display-time">{ALARM.postponedNow}</p>
        <p className="t-body-l">{ALARM.date}</p>
        <div className="noti-stack">
          <NotificationCard
            title={`알람이 ${ALARM.postponedTo}으로 미뤄졌어요`}
            body={`160번이 ${DELAY.minutes}분 늦게 와요. ${DELAY.minutes}분 더 주무셔도 돼요. (미루기 상한 ${ALARM.snoozeLimit})`}
            onClick={() => navigate('/route/delay')}
          />
          <NotificationCard icon={Route} title="다른 방법도 있어요" body="503번(7:36)을 타면 비슷하게 도착해요. 눌러서 대안 경로 보기" onClick={() => navigate('/route/delay')} />
        </div>
      </Content>
    </Screen>
  )
}
