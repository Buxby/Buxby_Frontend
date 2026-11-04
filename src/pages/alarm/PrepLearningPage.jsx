import { Fragment } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AlarmClock, DoorOpen, Info, Pencil, Settings } from 'lucide-react'
import { BottomNav, Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, Card, Divider, PrepRow } from '../../components/display'
import { LEARNING, PREP_BY_DAY } from '../../data/mock'
import { useAppState } from '../../store/context'
import { prepIcon } from './prepIcons'

function SettingsLink() {
  return (
    <Link to="/alarm/settings" className="icon-button" aria-label="알람 설정">
      <Settings size={22} color="var(--icon-default)" />
    </Link>
  )
}

// D1 준비 시간 학습 (시안②)
function Learned({ prep }) {
  const max = Math.max(...PREP_BY_DAY.map((d) => d.minutes))
  return (
    <>
      <Card padded>
        <span className="t-body-m-medium c-secondary">평균 준비 시간</span>
        <span className="big-number">
          <strong className="t-display-l">{LEARNING.averageMinutes}분</strong>
          <Info size={18} color="var(--icon-default)" aria-label="요일별 평균으로 계산" />
        </span>
        <div className="bar-chart" role="img" aria-label="요일별 평균 준비 시간">
          {PREP_BY_DAY.map((d) => (
            <span key={d.day} className="bar-chart__col">
              <span className={`bar-chart__bar ${d.highlight ? '' : 'bar-chart__bar--muted'}`} style={{ height: Math.round((d.minutes / max) * 64) }} />
              <span className="t-caption c-secondary">{d.day}</span>
            </span>
          ))}
        </div>
        <p className="t-caption c-tertiary">최근 2주간의 기록을 기반으로 계산했어요. 요일별 차이도 반영해요.</p>
      </Card>
      <Card>
        {prep.map((p, i) => (
          <Fragment key={p.id}>
            {i > 0 && <Divider />}
            <PrepRow icon={prepIcon(p.icon)} name={p.name} sub={`평균 ${p.minutes}분`} />
          </Fragment>
        ))}
      </Card>
    </>
  )
}

// D2 기록 부족 (직접 입력값으로 계산)
function Learning({ records }) {
  const days = Math.min(records, LEARNING.requiredDays)
  return (
    <>
      <Card padded>
        <div className="card-head">
          <span className="t-title-s">기록이 더 필요해요</span>
          <span className="spacer" />
          <Badge tone="neutral">직접 입력값 사용 중</Badge>
        </div>
        <span className="big-number">
          <strong className="t-display-l">{LEARNING.manualMinutes}분</strong>
          <span className="t-body-s c-secondary">직접 입력</span>
        </span>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={LEARNING.requiredDays} aria-valuenow={days}>
          <span className="progress__bar" style={{ width: `${(days / LEARNING.requiredDays) * 100}%` }} />
        </div>
        <span className="t-caption-medium c-brand">
          {LEARNING.requiredDays}일 중 {days}일 기록됨
        </span>
        <p className="t-body-s c-secondary">{LEARNING.requiredDays}일이 쌓이면 AI가 요일별 평균 준비 시간으로 바꿔 계산해요.</p>
      </Card>
      <section className="how-box">
        <p className="t-body-m-medium c-brand">이렇게 기록해요</p>
        {[
          [AlarmClock, '알람을 끈 시각을 기상 시각으로'],
          [DoorOpen, '‘출발했어요’를 누른 시각(또는 집을 벗어난 시각)을 출발 시각으로'],
          [Pencil, '처음에는 항목별 시간을 직접 입력하고, 기록으로 보정해요'],
        ].map(([HowIcon, text]) => (
          <p key={text} className="how-box__row t-body-s">
            <HowIcon size={18} color="var(--icon-brand)" />
            {text}
          </p>
        ))}
      </section>
    </>
  )
}

export default function PrepLearningPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state } = useAppState()
  const learning = params.get('state') === 'learning' || state.records < LEARNING.requiredDays

  return (
    <Screen>
      <TopBar title="준비 시간 학습" right={<SettingsLink />} backTo="/home" />
      <Content gap={12}>{learning ? <Learning records={state.records < LEARNING.requiredDays ? state.records : 3} /> : <Learned prep={state.prep} />}</Content>
      <Footer>
        <Button variant="secondary" onClick={() => navigate('/alarm/prep')}>
          {learning ? '준비 항목 직접 입력하기' : '준비 시간 다시 설정하기'}
        </Button>
      </Footer>
      <BottomNav />
    </Screen>
  )
}
