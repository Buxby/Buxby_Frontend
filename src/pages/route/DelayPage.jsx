import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { BottomNav, BottomSheet, Content, Screen, TopBar } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import { AlertBanner, BusRow, Card, Notice, Toast } from '../../components/display'
import { DELAY, DRT_INFO } from '../../data/mock'
import { useToast } from '../../lib/useToast'

const TABS = [
  { id: 'next', label: '다음 버스' },
  { id: 'other', label: '다른 노선' },
  { id: 'drt', label: 'DRT' },
]

// D8 버스 지연 안내 · D9 DRT 안내 시트
export default function DelayPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('next')
  const [drtOpen, setDrtOpen] = useState(false)
  const [toast, showToast] = useToast()

  const openOperator = () => {
    if (DRT_INFO.operatorUrl) window.open(DRT_INFO.operatorUrl, '_blank', 'noopener')
    else showToast('운영사 앱 연결 주소는 확인 후 연결돼요.')
  }

  return (
    <Screen>
      <TopBar title="버스 지연 안내" />
      <Content gap={12} style={{ paddingTop: 4, paddingBottom: 12 }}>
        <AlertBanner tone="danger" title="버스가 지연되고 있어요">
          현재 약 {DELAY.minutes}분 지연 예상입니다.
        </AlertBanner>
        <Card padded>
          <span className="t-body-s-medium c-secondary">변경된 도착 예상 시간</span>
          <span className="changed-time">
            <s className="t-title-m c-tertiary">{DELAY.before}</s>
            <ArrowRight size={20} color="var(--icon-strong)" aria-hidden="true" />
            <strong className="t-title-l c-danger">{DELAY.after}</strong>
          </span>
        </Card>
        <AlertBanner tone="info">
          {`알람이 자동으로 ${DELAY.minutes}분 미뤄졌어요.\n다른 방법으로도 갈 수 있어요.`}
        </AlertBanner>
        <h2 className="t-title-s">대안 경로</h2>
        <div className="chip-row chip-row--fill" role="tablist" aria-label="대안 경로">
          {TABS.map((t) => (
            <Chip key={t.id} selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
        {DELAY.alternatives.map((a) => (
          <div key={a.group} className={tab === a.group ? 'focus-ring' : ''}>
            <BusRow
              type={a.type}
              route={a.route}
              tag={a.tag}
              sub={a.sub}
              onClick={() => (a.type === 'drt' ? setDrtOpen(true) : navigate('/route/detail'))}
            />
          </div>
        ))}
      </Content>
      <BottomNav />

      <BottomSheet open={drtOpen} title="똑버스(DRT) 안내" onClose={() => setDrtOpen(false)}>
        <p className="t-body-m c-secondary">버스를 놓쳤을 때 이 지역에서 탈 수 있는 수요응답형 버스예요.</p>
        <dl className="info-table">
          {DRT_INFO.rows.map(([k, v]) => (
            <div key={k} className="info-table__row">
              <dt className="t-body-s c-secondary">{k}</dt>
              <dd className="t-body-s-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <Notice>버스비는 운행 지역과 시간만 안내해요. 실시간 위치·호출은 운영사 앱에서 진행돼요.</Notice>
        <Button onClick={openOperator}>똑타 앱 열기</Button>
      </BottomSheet>
      <Toast message={toast} />
    </Screen>
  )
}
