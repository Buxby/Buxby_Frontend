import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BellOff, BusFront, Briefcase, Clock, GraduationCap, MapPin, RefreshCw, Settings, ShieldCheck, User } from 'lucide-react'
import { BottomNav, BottomSheet, Content, Footer, Screen } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import { AdBanner, Badge, Card, Divider, IllustrationSlot, ListRow, Toast } from '../../components/display'
import { formatArrival, useAppState } from '../../store/context'
import { ALARM } from '../../data/mock'
import { deleteReservation } from '../../api/alarm'
import { searchRoutes } from '../../api/transit'
import { planAlarm } from '../../lib/alarmPlan'
import { toRouteOptions } from '../../lib/routes'
import { alarmView, clock, clockLabel } from '../../lib/time'
import { activeSnooze, snoozeLimitAt } from '../../lib/snooze'
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
function AlarmSetView({ state, update, onEdit, onCancel, onRefreshed }) {
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const { plan } = state
  const view = plan ? alarmView(plan) : ALARM

  // 경로를 다시 조회해 새 예약을 만든 뒤 이전 예약을 지운다 (실패해도 기존 알람 유지)
  const refreshPlan = async () => {
    const json = await searchRoutes(state.origin, state.destination)
    const options = toRouteOptions(json, state.origin.name, state.destination.name)
    const option = options.find((o) => o.id === state.routeDetail?.id)
    if (!option) throw new Error('선택한 노선을 찾지 못했어요. 노선을 다시 선택해 주세요.')
    const next = await planAlarm(state, option)
    update({ plan: next, routeDetail: option, routeOptions: options, snooze: null })
    await deleteReservation(plan.reservationId).catch(() => {})
  }

  const refresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      if (plan) await refreshPlan()
      else await new Promise((resolve) => setTimeout(resolve, 700))
      onRefreshed('경로를 다시 확인해 알람을 맞췄어요.')
    } catch (err) {
      onRefreshed(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const snooze = plan ? activeSnooze(state) : null
  const summary = !plan
    ? '160번 7:12 도착에 맞췄어요. 버스가 늦으면 알람도 미뤄져요.'
    : snooze
      ? `${clock(new Date(snooze.until))}에 다시 울려요 (${snooze.count}번 미룸)`
      : view.expired
      ? '지난 알람이에요. 새로고침하면 다음 일정으로 맞춰요.'
      : `${plan.bus} ${view.board} 승차에 맞췄어요.`
  const routeLabel = state.routeDetail ? `${state.routeDetail.type} ${state.routeDetail.name}` : `간선 ${state.route}번`
  const safetyTime = plan ? clockLabel(snoozeLimitAt(plan, state.settings)) : `오전 ${ALARM.snoozeLimit}`

  return (
    <>
      <section className="next-alarm">
        <div className="next-alarm__top">
          <span className="t-body-s-medium">{view.dayLabel} 기상 알람</span>
          <span className="next-alarm__live-group">
            {!plan && <span className="next-alarm__live t-caption-medium">실시간 조정 중</span>}
            <button type="button" className="next-alarm__refresh" onClick={refresh} aria-label="알람 시각 새로고침" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            </button>
          </span>
        </div>
        <button type="button" className="next-alarm__body" onClick={() => navigate('/alarm/wake')} aria-label="기상 알람 미리 보기">
        <span className="t-display-l">{view.wakeLabel}</span>
        <span className="t-body-s">{summary}</span>
        <span className="next-alarm__timeline">
          {[
            ['기상', view.wake],
            ['출발', view.depart],
            ['승차', view.board],
            ['도착', view.arrive],
          ].map(([k, v]) => (
            <span key={k}>
              <span className="t-caption">{k}</span>
              <span className="t-body-s-medium">{v}</span>
            </span>
          ))}
        </span>
        </button>
      </section>
      <Card>
        <ListRow icon={GraduationCap} label={`${state.category} · ${formatArrival(state.arrival, state.days).split(' · ')[1] ?? ''}`} value={`${state.destination?.name} · ${formatArrival(state.arrival)}`} onClick={onEdit} />
        <Divider />
        <ListRow icon={BusFront} label="이용 노선" value={`${routeLabel} · ${state.origin?.name ?? '내 집'}`} onClick={() => navigate('/route')} />
      </Card>
      <Card padded className="safety-card">
        <span className="safety-card__row">
          <ShieldCheck size={20} color="var(--icon-success)" />
          <span className="t-body-s">
            {state.settings.safetyAlarm ? '안전 알람' : '미루기 상한'} {safetyTime} · 이 시각 이후로는 미루지 않아요
          </span>
        </span>
      </Card>
      <button type="button" className="t-body-s-medium alarm-cancel-link" onClick={onCancel}>
        <BellOff size={16} aria-hidden="true" /> 알람 취소하기
      </button>
    </>
  )
}

// B1 첫 사용 · B2 입력 완료 · B3 알람 설정됨
export default function HomePage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, showToast] = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const location = useLocation()
  const routeToast = location.state?.toast

  // 기상 알람에서 미루고 돌아오면 다시 울릴 시각을 알려준다
  useEffect(() => {
    if (!routeToast) return
    showToast(routeToast)
    navigate(location.pathname, { replace: true, state: null })
  }, [routeToast, showToast, navigate, location.pathname])
  const ready = state.destination && state.arrival && state.origin && state.route

  const setAlarm = async () => {
    if (submitting) return
    if (!state.routeDetail) {
      showToast('노선을 다시 선택해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      update({ alarmSet: true, plan: await planAlarm(state) })
    } catch (err) {
      showToast(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const editAlarm = () => {
    const { plan } = state
    update({ alarmSet: false, plan: null, snooze: null })
    if (plan) deleteReservation(plan.reservationId).catch(() => showToast('이전 알람을 서버에서 지우지 못했어요.'))
  }

  // 일정(목적지·도착 시간·노선)은 그대로 두고 알람 예약만 지운다
  const cancelAlarm = async () => {
    if (cancelling) return
    const { plan } = state
    setCancelling(true)
    let failed = false
    if (plan) {
      await deleteReservation(plan.reservationId).catch((err) => {
        failed = err.status !== 404
      })
    }
    update({ alarmSet: false, plan: null, snooze: null, wakeOffAt: null, lastApproach: null })
    setCancelling(false)
    setConfirmCancel(false)
    showToast(failed ? '알람을 껐어요. 서버 예약은 지우지 못했어요.' : '알람을 취소했어요.')
  }

  if (state.alarmSet && ready) {
    const view = state.plan ? alarmView(state.plan) : ALARM
    return (
      <Screen>
        <HomeHeader />
        <Content gap={16}>
          <AlarmSetView state={state} update={update} onEdit={editAlarm} onCancel={() => setConfirmCancel(true)} onRefreshed={showToast} />
          <div className="spacer" />
          <AdBanner />
        </Content>
        <BottomNav />
        <BottomSheet open={confirmCancel} title="알람을 취소할까요?" onClose={() => setConfirmCancel(false)}>
          <p className="t-body-m">
            {view.dayLabel} {view.wakeLabel} 기상 알람과 출발 알림이 울리지 않아요.
          </p>
          <p className="t-body-s c-secondary">목적지·도착 시간·노선은 그대로 남아서 언제든 다시 알람을 맞출 수 있어요.</p>
          <Button onClick={cancelAlarm} disabled={cancelling}>
            {cancelling ? '취소하는 중…' : '알람 취소하기'}
          </Button>
          <Button variant="tertiary" onClick={() => setConfirmCancel(false)}>
            유지하기
          </Button>
        </BottomSheet>
        <Toast message={toast} />
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
          <ListRow icon={MapPin} label="출발 위치" value={state.origin?.name ?? ''} placeholder="출발 위치를 선택하세요" onClick={() => navigate('/schedule/origin')} />
          <Divider />
          <ListRow
            icon={BusFront}
            label="이용 노선"
            value={state.routeDetail ? `${state.routeDetail.type} ${state.routeDetail.name}` : state.route ? `간선 ${state.route}번` : ''}
            badge={state.routeDetail?.recommended || state.route === '160' ? <Badge tone="brand">추천</Badge> : null}
            placeholder="목적지와 출발 위치를 정하면 추천해요"
            onClick={() => (state.destination && state.origin ? navigate('/schedule/route') : showToast('목적지와 출발 위치를 먼저 정해 주세요.'))}
          />
        </Card>
      </Content>
      <Footer>
        <Button disabled={!ready || submitting} onClick={setAlarm}>
          {submitting ? '알람 계산 중…' : '이 일정으로 알람 설정하기'}
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
