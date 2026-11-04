import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BusFront, Briefcase, Clock, GraduationCap, MapPin, Settings, ShieldCheck, User } from 'lucide-react'
import { BottomNav, Content, Footer, Screen } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import { AdBanner, Badge, Card, Divider, IllustrationSlot, ListRow, Toast } from '../../components/display'
import { formatArrival, useAppState } from '../../store/context'
import { ALARM } from '../../data/mock'
import { useToast } from '../../lib/useToast'
import ArrivalSheet from './ArrivalSheet'

const CATEGORIES = [
  { label: '수업', icon: GraduationCap },
  { label: '출근', icon: Briefcase },
  { label: '기타', icon: User },
]

function HomeHeader() {
  return (
    <div className="home-header">
      <span className="t-title-s c-brand">버스비</span>
      <Link to="/alarm/settings" className="icon-button" aria-label="알람 설정">
        <Settings size={24} color="var(--icon-default)" />
      </Link>
    </div>
  )
}

function Hero() {
  return (
    <div className="hero">
      <div className="hero__text">
        <h1 className="t-title-l">
          내일도
          <br />
          제때 갈 수 있어요
        </h1>
        <p className="t-body-s c-secondary">AI가 버스 시간에 맞춰 깨워드려요</p>
      </div>
      <IllustrationSlot width={120} height={96} label="" />
    </div>
  )
}

// B3 알람 설정됨
function AlarmSetView({ state, onEdit }) {
  const navigate = useNavigate()
  return (
    <>
      <button type="button" className="next-alarm" onClick={() => navigate('/alarm/wake')} aria-label="기상 알람 미리 보기">
        <span className="next-alarm__top">
          <span className="t-body-s-medium">{ALARM.dayLabel} 기상 알람</span>
          <span className="next-alarm__live t-caption-medium">실시간 조정 중</span>
        </span>
        <span className="t-display-l">{ALARM.wakeLabel}</span>
        <span className="t-body-s">160번 7:12 도착에 맞췄어요. 버스가 늦으면 알람도 미뤄져요.</span>
        <span className="next-alarm__timeline">
          {[
            ['기상', ALARM.wake],
            ['출발', ALARM.depart],
            ['승차', ALARM.board],
            ['도착', ALARM.arrive],
          ].map(([k, v]) => (
            <span key={k}>
              <span className="t-caption">{k}</span>
              <span className="t-body-s-medium">{v}</span>
            </span>
          ))}
        </span>
      </button>
      <Card>
        <ListRow icon={GraduationCap} label={`${state.category} · ${formatArrival(state.arrival, state.days).split(' · ')[1] ?? ''}`} value={`${state.destination?.name} · ${formatArrival(state.arrival)}`} onClick={onEdit} />
        <Divider />
        <ListRow icon={BusFront} label="이용 노선" value={`간선 ${state.route}번 · ${state.origin?.name ?? '내 집'}`} onClick={() => navigate('/route')} />
      </Card>
      <Card padded className="safety-card">
        <span className="safety-card__row">
          <ShieldCheck size={20} color="var(--icon-success)" />
          <span className="t-body-s">
            안전 알람 {ALARM.snoozeLimit} · 이 시각 이후로는 미루지 않아요
          </span>
        </span>
      </Card>
    </>
  )
}

// B1 첫 사용 · B2 입력 완료 · B3 알람 설정됨
export default function HomePage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, showToast] = useToast()
  const ready = state.destination && state.arrival && state.origin && state.route

  if (state.alarmSet && ready) {
    return (
      <Screen>
        <HomeHeader />
        <Content gap={16}>
          <AlarmSetView state={state} onEdit={() => update({ alarmSet: false })} />
          <div className="spacer" />
          <AdBanner />
        </Content>
        <BottomNav />
      </Screen>
    )
  }

  return (
    <Screen>
      <HomeHeader />
      <Content gap={20}>
        <Hero />
        <div className="chip-row chip-row--fill" role="group" aria-label="일정 유형">
          {CATEGORIES.map(({ label, icon }) => (
            <Chip key={label} icon={icon} selected={state.category === label} onClick={() => update({ category: label })}>
              {label}
            </Chip>
          ))}
        </div>
        <Card>
          <ListRow icon={GraduationCap} label="목적지" value={state.destination?.name} placeholder="목적지를 검색하세요" onClick={() => navigate('/schedule/destination')} />
          <Divider />
          <ListRow icon={Clock} label="도착 희망 시간" value={formatArrival(state.arrival, state.days)} placeholder="시간을 선택하세요" onClick={() => setSheetOpen(true)} />
          <Divider />
          <ListRow icon={MapPin} label="출발 위치" value={state.origin ? `${state.origin.name} (구로구)` : ''} placeholder="출발 위치를 선택하세요" onClick={() => navigate('/schedule/origin')} />
          <Divider />
          <ListRow
            icon={BusFront}
            label="이용 노선"
            value={state.route ? `간선 ${state.route}번` : ''}
            badge={state.route === '160' ? <Badge tone="brand">추천</Badge> : null}
            placeholder="목적지를 먼저 정하면 추천해요"
            onClick={() => (state.destination ? navigate('/schedule/route') : showToast('목적지를 먼저 정해 주세요.'))}
          />
        </Card>
      </Content>
      <Footer>
        <Button disabled={!ready} onClick={() => update({ alarmSet: true })}>
          이 일정으로 알람 설정하기
        </Button>
      </Footer>
      <BottomNav />
      <ArrivalSheet
        open={sheetOpen}
        initial={state.arrival}
        days={state.days}
        bufferMinutes={state.settings.bufferMinutes}
        onClose={() => setSheetOpen(false)}
        onConfirm={(arrival, days) => {
          update({ arrival, days })
          setSheetOpen(false)
        }}
      />
      <Toast message={toast} />
    </Screen>
  )
}
